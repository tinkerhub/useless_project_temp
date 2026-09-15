'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  bio: string;
  avatar_url: string;
  is_premium: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('as_token');
    if (stored) {
      setToken(stored);
      api.me().then(setUser).catch(() => {
        localStorage.removeItem('as_token');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login({ email, password });
    localStorage.setItem('as_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const data = await api.register({ username, email, password });
    localStorage.setItem('as_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('as_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const data = await api.me();
    setUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
