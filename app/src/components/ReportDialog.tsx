import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PaymentsIcon from '@mui/icons-material/Payments';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import type { University, UserData } from '../types';
import MarkdownView from './MarkdownView';
import {
  REPORT_PRICE,
  RECEIPT_QR_PATH,
  RECEIPT_NOTICE,
  createOrder,
  generateReportMarkdown,
  saveReport,
  downloadDocx,
  downloadPdf,
} from '../utils/reportService';
import { useAuth } from '../context/AuthContext';

// build tag - cache bust marker (used to force new JS hash on redeploy)
const BUILD_TAG = 'v1.4-' + Date.now().toString(36).slice(-4);

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  userData: UserData;
  universities: University[];
}

type Step = 'intro' | 'pay' | 'generating' | 'ready' | 'error';

const ReportDialog: React.FC<ReportDialogProps> = ({ open, onClose, userData, universities }) => {
  const { loggedIn, user: currentUser, openLogin } = useAuth();
  const [step, setStep] = useState<Step>('intro');
  const [report, setReport] = useState('');
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<'docx' | 'pdf' | null>(null);
  const [qrFailed, setQrFailed] = useState(false);

  const handleStart = () => {
    setError('');
    if (!loggedIn) {
      onClose();
      openLogin();
      return;
    }
    setStep('pay');
  };

  const handleIHavePaid = async () => {
    setError('');
    if (!loggedIn || !currentUser) {
      setError('请先登录');
      setStep('error');
      return;
    }
    try {
      // build v1.2 - 2026-09-05 cache bust
      console.debug('[kaoyan]', BUILD_TAG); // forces vite to keep BUILD_TAG
      console.log('[ReportDialog] 开始创建订单, 用户:', currentUser);
      
      const { orderId, error: orderErr } = await createOrder(userData, currentUser);
      
      console.log('[ReportDialog] createOrder 返回:', { orderId, orderErr });
      
      if (!orderId) {
        // 显示详细错误信息
        const errorMsg = orderErr || '未知错误（请按F12查看控制台获取详情）';
        console.error('[ReportDialog] 订单创建失败, 完整错误:', errorMsg);
        setError(`订单创建失败：${errorMsg}`);
        setStep('error');
        return;
      }
      console.log('[ReportDialog] 订单创建成功, ID:', orderId);
      setStep('generating');
      const md = await generateReportMarkdown(userData, universities);
      setReport(md);
      // 报告保存到 reports 集合（用于后续追溯），不阻塞主流程
      void saveReport(md, userData, universities, currentUser);
      setStep('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : '报告生成失败');
      setStep('error');
    }
  };

  const handleDownload = async (kind: 'docx' | 'pdf') => {
    setDownloading(kind);
    try {
      const filename = `考研院校推荐分析报告_${userData.targetMajor || '择校'}.${kind === 'docx' ? 'docx' : 'pdf'}`;
      if (kind === 'docx') {
        await downloadDocx(report, filename);
      } else {
        await downloadPdf(report, filename);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '下载失败');
      setStep('error');
    } finally {
      setDownloading(null);
    }
  };

  const handleClose = () => {
    onClose();
    // 延迟重置避免闪烁
    setTimeout(() => {
      setStep('intro');
      setReport('');
      setError('');
    }, 200);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PaymentsIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            完整院校分析报告
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {step === 'intro' && (
          <Box>
            <Typography sx={{ mb: 1.5 }}>
              基于你的成绩与当前推荐的院校，DeepSeek AI 将为你生成一份<b>详尽的分析报告</b>，包含：
            </Typography>
            <Box component="ul" sx={{ pl: 3, my: 1 }}>
              <li>考生情况概览与分数竞争力点评</li>
              <li>总体择校策略与「冲稳保」配比建议</li>
              <li>每所推荐院校的逐校深度分析</li>
              <li>报考风险提示与备选方案</li>
              <li>分科目复习冲刺与时间规划建议</li>
            </Box>
            <Alert severity="info" sx={{ mt: 2 }}>
              完整报告生成与下载费用为 <b>¥{REPORT_PRICE}</b>（一次性，微信/支付宝扫码支付）。报告同时支持下载 <b>Word</b> 与 <b>PDF</b> 文档。
            </Alert>
          </Box>
        )}

        {step === 'pay' && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
              ¥{REPORT_PRICE}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              请使用微信 / 支付宝扫描下方收款码完成支付
            </Typography>
            <Box
              sx={{
                width: 220,
                height: 220,
                mx: 'auto',
                mb: 2,
                border: '1px dashed #cbd5e1',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f8fafc',
                overflow: 'hidden',
              }}
            >
              {!qrFailed ? (
                <img
                  src={RECEIPT_QR_PATH}
                  alt="收款码"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={() => setQrFailed(true)}
                />
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  收款码暂未上传
                  <br />
                  <span style={{ fontSize: 12 }}>请联系站长获取收款方式</span>
                </Typography>
              )}
            </Box>
            {!loggedIn && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                请先登录后再支付（登录后报告会绑定到你的账号）。
              </Alert>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
              {RECEIPT_NOTICE}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
              {!loggedIn ? (
                <Button variant="contained" startIcon={<QrCode2Icon />} onClick={() => { onClose(); openLogin(); }}>
                  先登录
                </Button>
              ) : (
                <>
                  <Button variant="contained" color="success" onClick={handleIHavePaid}>
                    我已支付，生成报告
                  </Button>
                  <Button variant="outlined" onClick={() => setStep('intro')}>
                    返回
                  </Button>
                </>
              )}
            </Box>
          </Box>
        )}

        {step === 'generating' && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress />
            <Typography sx={{ mt: 3 }}>DeepSeek 正在为你撰写分析报告，约需 20~40 秒…</Typography>
          </Box>
        )}

        {step === 'ready' && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              报告已生成，可下载 Word / PDF 文档保存。
            </Alert>
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<DescriptionIcon />}
                disabled={downloading !== null}
                onClick={() => handleDownload('docx')}
              >
                {downloading === 'docx' ? <CircularProgress size={18} color="inherit" /> : '下载 Word'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                disabled={downloading !== null}
                onClick={() => handleDownload('pdf')}
              >
                {downloading === 'pdf' ? <CircularProgress size={18} color="inherit" /> : '下载 PDF'}
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ maxHeight: '50vh', overflowY: 'auto', pr: 1 }}>
              <MarkdownView content={report} />
            </Box>
          </Box>
        )}

        {step === 'error' && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
              <Typography variant="body2" component="div">
                {error}
              </Typography>
              {error && error.length > 100 && (
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ mt: 1, display: 'block', wordBreak: 'break-all' }}
                >
                  技术详情：{error}
                </Typography>
              )}
            </Alert>
            
            {/* 常见问题提示 */}
            {(error?.includes('权限') || error?.includes('集合') || error?.includes('不存在')) && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#fffbeb', borderRadius: 1, textAlign: 'left' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#92400e' }}>
                  🔧 解决方案：
                </Typography>
                <Typography variant="body2" sx={{ color: '#78350f', fontSize: '0.875rem' }}>
                  {error?.includes('集合') || error?.includes('不存在') ? (
                    <>请在 CloudBase 控制台（<a href="https://tcb.cloud.tencent.com/dev" target="_blank" rel="noopener noreferrer" style={{color:'#2563eb'}}>点击访问</a>）创建 <strong>orders</strong> 集合，并设置安全规则为「所有已登录用户可读写」。</>
                  ) : error?.includes('权限') ? (
                    <>请在 CloudBase 控制台修改 <strong>orders</strong> 集合的安全规则，允许已登录用户写入数据。</>
                  ) : (
                    <>请检查网络连接，或刷新页面后重试。如问题持续，请联系客服。</>
                  )}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 3, display: 'flex', gap: 1.5, justifyContent: 'center' }}>
              <Button variant="outlined" onClick={() => setStep('intro')}>
                返回重试
              </Button>
              <Button 
                variant="text" 
                size="small"
                onClick={() => {
                  // 复制错误信息到剪贴板
                  navigator.clipboard.writeText(error || '');
                  alert('错误信息已复制，可发送给客服');
                }}
              >
                复制错误信息
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      {step === 'intro' && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>取消</Button>
          <Button variant="contained" color="primary" startIcon={<DownloadIcon />} onClick={handleStart}>
            {loggedIn ? `生成完整报告 ¥${REPORT_PRICE}` : '登录后生成完整报告'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ReportDialog;
