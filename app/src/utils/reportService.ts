import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { getCloudBaseApp, getDatabase } from './cloudbase';
import { DEEPSEEK_PROXY_FUNCTION } from './cloudAi';
import type { AuthUser } from './cloudbase';
import type { University, UserData } from '../types';

// 报告单价（元）
export const REPORT_PRICE = 2;

// 收款码图片路径（请将你的个人收款码放到 app/public/receipt-qr.png）
export const RECEIPT_QR_PATH = '/receipt-qr-v2.png';

// 收款说明
export const RECEIPT_NOTICE =
  `请使用微信/支付宝扫描上方收款码，支付 ${REPORT_PRICE} 元后点击下方「我已支付」。\n` +
  '支付后报告将立即生成，可下载 Word / PDF。';

export interface OrderRecord {
  _id?: string;
  amount: number;
  status: 'paid_pending'; // 人工待确认
  itemType: 'report';
  userData?: UserData;
  reportId?: string;
  createdAt: Date;
  username?: string;
}

export interface ReportRecord {
  _id?: string;
  markdown: string;
  userData?: UserData;
  universities?: University[];
  createdAt: Date;
  username?: string;
}

/**
 * 生成一次付费订单（用户在"我已支付"时调用）
 * 需传入已确认的登录用户（避免二次 getSession 出现竞态/识别异常）
 * 返回 { orderId, error }，error 含真实错误信息便于诊断
 */
export async function createOrder(
  userData: UserData,
  currentUser: AuthUser | null
): Promise<{ orderId: string | null; error?: string }> {
  if (!currentUser) return { orderId: null, error: '当前未登录' };
  
  // 预检查：确保数据库可用
  try {
    const db = getDatabase();
    if (!db) {
      return { orderId: null, error: '数据库连接不可用，请检查网络或刷新页面重试' };
    }
    
    console.log('[Report] 开始创建订单, 用户:', currentUser.username || currentUser.id);
    console.log('[Report] 数据库实例:', db);
    
    const orderData = {
      amount: REPORT_PRICE,
      status: 'paid_pending',
      itemType: 'report',
      userData,
      username: currentUser.username || currentUser.nickname || undefined,
      createdAt: new Date(),
    };
    console.log('[Report] 订单数据:', orderData);
    
    const res = await db.collection('orders').add(orderData as Partial<OrderRecord>);
    
    console.log('[Report] 数据库返回原始结果:', res);
    console.log('[Report] 结果类型:', typeof res, '是否为数组:', Array.isArray(res));
    
    // CloudBase SDK 可能返回不同格式的结果
    let orderId: string | null = null;
    
    if (res) {
      // 尝试多种方式获取 ID
      if (typeof res === 'object' && !Array.isArray(res)) {
        // 对象格式: { id } 或 { _id }
        orderId = (res as any).id || (res as any)._id || null;
      } else if (Array.isArray(res) && res.length > 0) {
        // 数组格式: [{ id }]
        orderId = (res[0] as any)?.id || (res[0] as any)?._id || null;
      } else if (typeof res === 'string') {
        // 字符串格式（直接就是 ID）
        orderId = res;
      }
    }
    
    console.log('[Report] 解析后的订单ID:', orderId);
    
    if (!orderId) {
      // 即使没有抛出异常，但也没有获得有效的订单ID
      return { 
        orderId: null, 
        error: `数据库写入成功但未返回订单ID（原始响应: ${JSON.stringify(res).slice(0, 200)}）。可能是 orders 集合不存在或权限配置问题。` 
      };
    }
    
    return { orderId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Report] 创建订单异常:', err);
    console.error('[Report] 错误详情:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    
    // 提供更友好的错误提示
    let userFriendlyMsg = msg;
    if (msg.includes('permission') || msg.includes('权限') || msg.includes('Permission denied')) {
      userFriendlyMsg = '数据库权限不足！请在 CloudBase 控制台为 orders 集合设置安全规则（允许所有已登录用户读写）';
    } else if (msg.includes('network') || msg.includes('timeout') || msg.includes('Network') || msg.includes('fetch')) {
      userFriendlyMsg = '网络连接异常，请检查网络后重试';
    } else if (msg.includes('collection') || msg.includes('集合') || msg.includes('not exist')) {
      userFriendlyMsg = 'orders 数据表不存在！请在 CloudBase 控制台创建该集合';
    } else if (msg.includes('auth') || msg.includes('unauthorized') || msg.includes('login') || msg.includes('Unauthorized')) {
      userFriendlyMsg = '登录状态已失效，请重新登录后重试';
    } else if (msg.includes('quota') || msg.includes('配额')) {
      userFriendlyMsg = '数据库写入次数已达上限，请联系管理员';
    }
    
    return { orderId: null, error: userFriendlyMsg };
  }
}

/**
 * 调用 DeepSeek 中转云函数生成完整分析报告（Markdown）
 * 需要登录（由调用方保证）
 */
export async function generateReportMarkdown(
  userData: UserData,
  universities: University[]
): Promise<string> {
  try {
    const app = getCloudBaseApp();
    console.log('[Report] 开始调用云函数生成报告...');
    
    const res = await app.callFunction({
      name: DEEPSEEK_PROXY_FUNCTION,
      data: { action: 'report', userData, universities },
    });
    
    console.log('[Report] 云函数返回:', res);
    const result = res?.result as { code?: number; message?: string; data?: { content?: string } };
    
    if (!result) {
      throw new Error('云函数无响应，请检查网络连接');
    }
    if (result.code !== 0 || !result.data?.content) {
      const errMsg = result.message || '报告内容为空';
      console.error('[Report] 云函数错误:', result);
      throw new Error(errMsg);
    }
    
    return result.data.content;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Report] 生成报告失败:', err);
    
    // 提供更友好的错误提示
    if (msg.includes('timeout') || msg.includes('超时')) {
      throw new Error('报告生成超时，请稍后重试（AI分析需要20-40秒）');
    } else if (msg.includes('function') || msg.includes('云函数')) {
      throw new Error('AI服务暂时不可用，请稍后重试或联系客服');
    }
    throw new Error(msg);
  }
}

/**
 * 保存报告到 reports 集合
 */
export async function saveReport(
  markdown: string,
  userData: UserData,
  universities: University[],
  currentUser: AuthUser | null
): Promise<string | null> {
  if (!currentUser) return null;
  try {
    const db = getDatabase();
    const res = await db.collection('reports').add({
      markdown,
      userData,
      universities,
      username: currentUser.username || currentUser.nickname || undefined,
      createdAt: new Date(),
    } as Partial<ReportRecord>);
    return (res as { _id?: string })._id ?? null;
  } catch (err: unknown) {
    console.warn('保存报告失败:', err);
    return null;
  }
}

// ==================== Markdown 简单解析为 docx ====================

interface MdBlock {
  level: number; // 0=正文,1=#,2=##,3=###,4=####
  text: string;
}

function parseMarkdownToBlocks(md: string): MdBlock[] {
  return md
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .map((line) => {
      const m = line.match(/^(#{1,4})\s+(.*)/);
      if (m) return { level: m[1].length, text: m[2] };
      return { level: 0, text: line };
    });
}

function stripMdInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1（$2）')
    .replace(/^\s*[-*+]\s+/, '')
    .replace(/^\s*>\s?/, '')
    .replace(/^#{1,4}\s*/, '')
    .replace(/\|/g, ' ');
}

/**
 * 从 Markdown 生成 Word (.docx)，前端直接下载
 */
export async function downloadDocx(
  markdown: string,
  filename = '考研院校推荐分析报告.docx'
): Promise<void> {
  const blocks = parseMarkdownToBlocks(markdown);
  const children = blocks.map((b) => {
    if (b.level === 1) {
      return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 120 },
        children: [new TextRun({ text: stripMdInline(b.text), bold: true, size: 32 })],
      });
    }
    if (b.level === 2) {
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 180, after: 100 },
        children: [new TextRun({ text: stripMdInline(b.text), bold: true, size: 28 })],
      });
    }
    if (b.level >= 3) {
      return new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 140, after: 80 },
        children: [new TextRun({ text: stripMdInline(b.text), bold: true, size: 24 })],
      });
    }
    return new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: stripMdInline(b.text), size: 22 })],
    });
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: '考研院校推荐分析报告', bold: true, size: 44 })],
          }),
          ...children,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 极简 Markdown -> HTML（用于 PDF 渲染）。 */
function mdToHtml(md: string): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');

  const lines = md.split('\n');
  const html: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  const flushTable = () => {
    if (tableRows.length) {
      html.push('<table><tbody>' + tableRows.join('') + '</tbody></table>');
      tableRows = [];
    }
    inTable = false;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushTable();
      html.push('<div style="height:8px"></div>');
      continue;
    }
    // 表格行
    if (line.includes('|')) {
      if (!inTable) inTable = true;
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((c, i, arr) => !(i === 0 && c === '') && !(i === arr.length - 1 && c === ''));
      const isSep = cells.every((c) => /^:?-{2,}:?$/.test(c.replace(/\s/g, '')));
      if (isSep) continue;
      tableRows.push(
        '<tr>' + cells.map((c) => `<td>${esc(c)}</td>`).join('') + '</tr>'
      );
      continue;
    }
    flushTable();

    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      const n = h[1].length;
      const size = n === 1 ? 22 : n === 2 ? 18 : n === 3 ? 16 : 14;
      html.push(`<h${n} style="font-size:${size}px;margin:12px 0 6px">${esc(h[2])}</h${n}>`);
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      html.push(`<li style="margin-left:18px">${esc(line.replace(/^\s*[-*+]\s+/, ''))}</li>`);
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      html.push(
        `<blockquote style="border-left:3px solid #999;padding-left:10px;color:#444">${esc(line.replace(/^\s*>\s?/, ''))}</blockquote>`
      );
      continue;
    }
    html.push(`<p>${esc(line)}</p>`);
  }
  flushTable();
  return html.join('');
}

/**
 * 从 Markdown 生成 PDF。
 * 通过 html2canvas 将排版后的 HTML 截图后按 A4 高度分页写入 jsPDF，
 * 中文由浏览器字体渲染，避免 jsPDF 缺中文字体问题。
 */
export async function downloadPdf(
  markdown: string,
  filename = '考研院校推荐分析报告.pdf'
): Promise<void> {
  // 构建离屏容器
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-10000px;top:0;width:794px;background:#fff;color:#111;z-index:-1;padding:48px;box-sizing:border-box;font-family:"PingFang SC","Microsoft YaHei",sans-serif;font-size:13px;line-height:1.7;';
  container.innerHTML = mdToHtml(markdown);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const imgW = 794; // A4 宽度(px,96dpi) 约 794
    const ratio = canvas.width / imgW;
    const contentH = Math.round(canvas.height / ratio); // 内容总高度(px)
    const pageH = 1123; // A4 高度约 1123px
    const margin = 20;

    const pdf = new jsPDF({ unit: 'px', format: 'a4', hotfixes: ['px_scaling'] });
    let y = 0;
    let page = 0;
    while (y < contentH) {
      if (page > 0) pdf.addPage();
      const sliceH = pageH - margin * 2;
      const cropH = Math.min(sliceH, contentH - y);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.round(cropH * ratio);
      const ctx = sliceCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, y * ratio, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);
      }
      const imgData = sliceCanvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(imgData, 'JPEG', 0, 0, imgW, cropH);
      y += cropH;
      page += 1;
    }
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
