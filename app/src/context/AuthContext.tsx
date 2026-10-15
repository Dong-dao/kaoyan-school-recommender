import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  getCurrentSession,
  loginWithUsername,
  signUpWithUsername,
  sendPhoneOtp,
  logout as doLogout,
  type AuthUser,
} from '../utils/cloudbase';
import LoginDialog from '../components/LoginDialog';

interface AuthContextValue {
  /** 当前登录用户；未登录为 null */
  user: AuthUser | null;
  /** 是否已登录 */
  loggedIn: boolean;
  /** 是否正在初始化会话 */
  initializing: boolean;
  /** 刷新当前会话 */
  refresh: () => Promise<void>;
  /** 登录：username + password */
  login: (username: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  /** 注册：username + password */
  register: (username: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  /** 发送手机验证码（自动注册/登录二合一），返回校验回调 */
  sendPhoneOtp: typeof sendPhoneOtp;
  /** 登出 */
  logout: () => Promise<void>;
  /** 打开登录/注册弹窗 */
  openLogin: () => void;
  /** 关闭登录/注册弹窗 */
  closeLogin: () => void;
  /** 登录弹窗是否打开 */
  loginOpen: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loggedIn: false,
  initializing: true,
  refresh: async () => {},
  login: async () => ({ ok: false }),
  register: async () => ({ ok: false }),
  sendPhoneOtp: async () => ({ ok: false }),
  logout: async () => {},
  openLogin: () => {},
  closeLogin: () => {},
  loginOpen: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  const openLogin = useCallback(() => setLoginOpen(true), []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);

  const refresh = useCallback(async () => {
    const { user: u } = await getCurrentSession();
    setUser(u);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { user: u } = await getCurrentSession();
      if (!mounted) return;
      setUser(u);
      setInitializing(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await loginWithUsername(username, password);
    if (res.ok) {
      await refresh();
      setLoginOpen(false);
    }
    return res;
  }, [refresh]);

  const register = useCallback(async (username: string, password: string) => {
    const res = await signUpWithUsername(username, password);
    if (res.ok) {
      await refresh();
      setLoginOpen(false);
    }
    return res;
  }, [refresh]);

  const logout = useCallback(async () => {
    await doLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loggedIn: Boolean(user),
        initializing,
        refresh,
        login,
        register,
        sendPhoneOtp,
        logout,
        openLogin,
        closeLogin,
        loginOpen,
      }}
    >
      {children}
      <LoginDialog open={loginOpen} onClose={closeLogin} />
    </AuthContext.Provider>
  );
};
