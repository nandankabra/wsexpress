import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { clearSession, getRefreshToken, getStoredUser, storeSession } from '../api/axiosClient';

const AuthContext = createContext(null);

const HOME_BY_ROLE = { CUSTOMER: '/customer', CARRIER: '/carrier', ADMIN: '/admin' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    storeSession(data);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await authApi.register({ name, email, password });
    storeSession(data);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout(getRefreshToken());
    } catch (err) {
      // best effort - still clear the local session
    }
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, register, logout, homePath: user ? HOME_BY_ROLE[user.role] : '/' }), [
    user, login, register, logout,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { HOME_BY_ROLE };
