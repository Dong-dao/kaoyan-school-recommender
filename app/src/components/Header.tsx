import React, { useState } from 'react';
import { AppBar, Toolbar, Box, Button, Typography, Avatar, Menu, MenuItem, Chip } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import SchoolIcon from '@mui/icons-material/School';
import type { CloudSyncState } from '../utils/cloudbase';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  cloudState?: CloudSyncState;
}

const CLOUD_LABEL: Record<CloudSyncState, { text: string; dot: string }> = {
  online: { text: '云端已连接', dot: 'bg-green-500' },
  offline: { text: '离线模式', dot: 'bg-yellow-500' },
  unknown: { text: '连接检测中', dot: 'bg-gray-400' },
};

const Header: React.FC<HeaderProps> = ({ cloudState = 'unknown' }) => {
  const cloud = CLOUD_LABEL[cloudState];
  const { user, loggedIn, logout, openLogin } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
  };

  const displayName = user?.nickname || user?.username || '用户';

  return (
    <>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: '1px solid', borderColor: '#dbeafe', bgcolor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}
      >
        <Toolbar sx={{ gap: 2, minHeight: 64 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
            <Avatar sx={{ bgcolor: '#1E40AF', width: 36, height: 36 }}>
              <SchoolIcon fontSize="small" />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e3a8a', lineHeight: 1.2 }}>
                考研院校推荐系统
              </Typography>
              <Typography variant="caption" color="text.secondary">
                基于复录比的智能推荐
              </Typography>
            </Box>
          </Box>

          <Chip
            size="small"
            sx={{ display: { xs: 'none', md: 'inline-flex' } }}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box
                  component="span"
                  sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cloud.dot.replace('bg-', ''), display: 'inline-block' }}
                />
                <span>{cloud.text}</span>
              </Box>
            }
            variant="outlined"
          />

          {loggedIn ? (
            <>
              <Button
                color="inherit"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                startIcon={<Avatar sx={{ width: 26, height: 26, bgcolor: '#3B82F6', fontSize: 14 }}>{displayName[0]?.toUpperCase()}</Avatar>}
                sx={{ textTransform: 'none', borderRadius: 3, px: 1 }}
              >
                <Typography variant="body2" sx={{ color: '#1e3a8a', fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </Typography>
              </Button>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem disabled sx={{ fontSize: 13 }}>已登录：{user?.username}</MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> 退出登录
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<LoginIcon />}
              onClick={openLogin}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              登录 / 注册
            </Button>
          )}
        </Toolbar>
      </AppBar>
    </>
  );
};

export default Header;
