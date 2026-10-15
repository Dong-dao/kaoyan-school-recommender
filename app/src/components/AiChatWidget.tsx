import React, { useState, useRef, useEffect } from 'react';
import {
  Fab,
  Box,
  Paper,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  TextField,
  IconButton,
  List,
  ListItem,
  Chip,
  Button,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LoginIcon from '@mui/icons-material/Login';
import type { University } from '../types';
import type { UserData } from '../types';
import { processAiMessage, welcomeMessage, type ChatTurn } from '../utils/aiService';
import { useAuth } from '../context/AuthContext';

interface AiChatWidgetProps {
  /** 用户从对话中点“查看推荐”时的回调：接收解析后的 UserData 与院校列表 */
  onShowRecommendations: (data: UserData, universities: University[]) => void;
}

// 快捷提问建议
const SUGGESTIONS = [
  '总分 360 计算机 想去北京 985',
  '电子专业 成都 想考重点院校',
  '本科普通二本 想冲 211',
];

const AiChatWidget: React.FC<AiChatWidgetProps> = ({ onShowRecommendations }) => {
  const { loggedIn, openLogin, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingResult, setPendingResult] = useState<{
    conditions: string;
    hasRecommendation: boolean;
    universities?: University[];
    userData?: UserData;
  } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const greetingForUser = () =>
    loggedIn
      ? welcomeMessage()
      : welcomeMessage() +
        '\n\n🔐 目前你尚未登录。登录后我才能调用 DeepSeek 真·AI 为你生成个性化择校建议（右上角「登录/注册」即可）。';

  // 打开时给一条欢迎语
  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && messages.length === 0) {
      setMessages([{ role: 'assistant', content: greetingForUser() }]);
    }
  };

  // 消息更新后自动滚到底部
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking, open]);

  const applyResult = (
    universities: University[] | undefined,
    userData: UserData | undefined
  ) => {
    if (!universities || !userData) return;
    setOpen(false);
    onShowRecommendations(userData, universities);
  };

  const handleSend = async (raw?: string) => {
    const content = (raw ?? input).trim();
    if (!content || thinking) return;
    setInput('');
    setPendingResult(null);
    setShowLoginPrompt(false);

    if (!loggedIn) {
      setMessages((prev) => [...prev, { role: 'user', content }]);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '🔐 使用 DeepSeek 真·AI 择校助手需要先登录。\n\n' +
            '点击下方「去登录/注册」或页面右上角「登录 / 注册」创建账号即可（登录后你的查询历史也会自动保存到云端）。',
        },
      ]);
      setShowLoginPrompt(true);
      return;
    }

    setMessages((prev) => [...prev, { role: 'user', content }]);
    setThinking(true);
    try {
      const res = await processAiMessage(content);
      const replyTurn: ChatTurn = {
        role: 'assistant',
        content: res.reply,
        conditions: res.conditions,
        hasRecommendation: res.hasRecommendation,
        source: res.source,
      };
      setMessages((prev) => [...prev, replyTurn]);
      if (res.hasRecommendation && res.universities && res.userData) {
        setPendingResult({
          conditions: res.reply,
          hasRecommendation: true,
          universities: res.universities,
          userData: res.userData,
        });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `抱歉，处理时出了点问题：${err instanceof Error ? err.message : String(err)}`,
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const quickApply = (text: string) => {
    void handleSend(text);
  };

  return (
    <>
      {/* 浮动助手指南按钮 */}
      <Tooltip title="智能择校助手" placement="left">
        <Fab
          color="primary"
          aria-label="open-ai-assistant"
          onClick={handleToggle}
          sx={{
            position: 'fixed',
            right: 24,
            bottom: 24,
            zIndex: 1200,
            width: 60,
            height: 60,
            background: 'linear-gradient(135deg,#1E40AF,#3B82F6)',
            '&:hover': { background: 'linear-gradient(135deg,#1E3A8A,#2563EB)' },
          }}
        >
          {open ? (
            <CloseIcon />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SmartToyIcon />
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  bgcolor: '#22c55e',
                  border: '2px solid #fff',
                }}
              />
            </Box>
          )}
        </Fab>
      </Tooltip>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 400 }, maxWidth: '100%', height: '100%' } } }}
      >
        <AppBar position="static" color="primary" elevation={0}>
          <Toolbar sx={{ gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#fff', color: '#1E40AF' }}>
              <SmartToyIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                智能择校助手
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {loggedIn
                  ? `已登录${user?.username ? `：${user.username}` : ''} · DeepSeek AI`
                  : '登录后启用 DeepSeek 真·AI'}
              </Typography>
            </Box>
            <IconButton color="inherit" onClick={() => setOpen(false)} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* 对话消息区 */}
        <Box
          ref={listRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            bgcolor: '#F1F5F9',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <Box
                key={i}
                sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}
              >
                <Box>
                  <Paper
                    elevation={0}
                    sx={{
                      maxWidth: '80%',
                      px: 1.5,
                      py: 1,
                      bgcolor: isUser ? 'primary.main' : '#fff',
                      color: isUser ? '#fff' : 'text.primary',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    {msg.content}
                  </Paper>
                  {!isUser && msg.source && (
                    <Box sx={{ mt: 0.5, pl: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        {msg.source === 'cloud' ? '✨ 云端 AI 生成' : '· 本地解析'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}

          {/* “查看推荐”操作按钮 */}
          {pendingResult?.hasRecommendation && pendingResult.userData && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<AutoAwesomeIcon />}
                onClick={() =>
                  applyResult(pendingResult.universities, pendingResult.userData)
                }
                sx={{ borderRadius: 3, textTransform: 'none', mt: 0.5 }}
              >
                查看推荐院校 →
              </Button>
            </Box>
          )}

          {/* 登录提示操作 */}
          {showLoginPrompt && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<LoginIcon />}
                onClick={() => {
                  setOpen(false);
                  openLogin();
                }}
                sx={{ borderRadius: 3, textTransform: 'none', mt: 0.5 }}
              >
                去登录 / 注册
              </Button>
            </Box>
          )}

          {thinking && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 1, pl: 1 }}>
              <CircularProgress size={18} color="primary" />
              <Typography variant="body2" color="text.secondary">
                正在分析你的情况…
              </Typography>
            </Box>
          )}

          {/* 欢迎时的快捷提问 */}
          {messages.length === 1 && !thinking && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                试试快捷提问：
              </Typography>
              <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {SUGGESTIONS.map((s) => (
                  <ListItem
                    key={s}
                    disablePadding
                    onClick={() => quickApply(s)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Chip
                      label={s}
                      variant="outlined"
                      color="primary"
                      onClick={() => quickApply(s)}
                      sx={{ borderRadius: 3, '&:hover': { bgcolor: 'primary.50' } }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>

        {/* 输入区 */}
        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              minRows={1}
              maxRows={4}
              size="small"
              placeholder="描述你的情况，如：总分360，计算机专业，想去北京…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <IconButton
              color="primary"
              disabled={!input.trim() || thinking}
              onClick={() => void handleSend()}
              aria-label="send"
              sx={{ bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' }, '&:disabled': { bgcolor: '#cbd5e1' } }}
            >
              <SendIcon />
            </IconButton>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, px: 0.5 }}>
            支持自然语言描述，也可用 <strong>换行(Shift+Enter)</strong> 续写。
          </Typography>
        </Box>
      </Drawer>
    </>
  );
};

export default AiChatWidget;
