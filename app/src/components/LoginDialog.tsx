import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Alert,
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../context/AuthContext';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ open, onClose }) => {
  const { sendPhoneOtp, refresh } = useAuth();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 手机验证码
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const verifyOtpRef = useRef<((args: { token: string }) => Promise<unknown>) | null>(null);

  const reset = () => {
    setError('');
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    setCode('');
    setSent(false);
    onClose();
  };

  // ---------- 手机验证码 ----------
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    setError('');
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的 11 位手机号');
      return;
    }
    setLoading(true);
    try {
      const res = await sendPhoneOtp(`+86${phone}`);
      if (!res.ok || !res.verifyOtp) {
        setError(res.message || '验证码发送失败');
        setLoading(false);
        return;
      }
      verifyOtpRef.current = res.verifyOtp;
      setSent(true);
      setCode('');
      startCountdown();
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证码发送失败');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError('');
    if (!verifyOtpRef.current) {
      setError('请先发送验证码');
      return;
    }
    if (!code.trim()) {
      setError('请输入验证码');
      return;
    }
    setLoading(true);
    try {
      const result = (await verifyOtpRef.current({ token: code.trim() })) as {
        error?: { message?: string } | null;
      };
      if (result?.error) {
        setError(result.error.message || '验证失败');
        setLoading(false);
        return;
      }
      await refresh();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证失败');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            手机验证码登录
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          登录后可体验 DeepSeek 真·AI 择校推荐，查询历史自动保存到云端。新手机号将自动注册。
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="手机号"
            fullWidth
            size="small"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="请输入 11 位手机号"
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">+86</InputAdornment>,
              },
            }}
          />
          {sent ? (
            <>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="验证码"
                  fullWidth
                  size="small"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="请输入短信验证码"
                />
                <Button
                  variant="outlined"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || loading}
                  sx={{ whiteSpace: 'nowrap', minWidth: 110 }}
                >
                  {countdown > 0 ? `${countdown}s 后重发` : '重发'}
                </Button>
              </Box>
              <Button variant="contained" color="primary" onClick={handleVerifyCode} disabled={loading}>
                {loading ? <CircularProgress size={22} color="inherit" /> : '手机验证码登录'}
              </Button>
            </>
          ) : (
            <Button variant="contained" color="primary" onClick={handleSendCode} disabled={loading}>
              {loading ? <CircularProgress size={22} color="inherit" /> : '发送验证码'}
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;