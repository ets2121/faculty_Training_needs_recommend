'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { AuthUser, RoleName } from '@/types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: RoleName[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err: any) {
      console.error('Failed to fetch auth user profile:', err);
      setUser(null);
      localStorage.removeItem('access_token');
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    if (savedToken) {
      setToken(savedToken);
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      const { access_token, user: loggedUser } = res.data;
      localStorage.setItem('access_token', access_token);
      setToken(access_token);
      setUser(loggedUser);
      showToast('success', 'Login Successful', `Welcome back, ${loggedUser.full_name || loggedUser.username}!`);

      // Smart redirect based on role
      if (loggedUser.role === 'faculty') {
        router.push('/faculty-dashboard');
      } else if (loggedUser.role === 'department_admin') {
        router.push('/dept-dashboard');
      } else if (loggedUser.role === 'campus_admin') {
        router.push('/campus-dashboard');
      } else if (loggedUser.role === 'system_admin') {
        router.push('/admin-dashboard');
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Invalid login credentials.';
      showToast('error', 'Authentication Failed', detail);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
    showToast('info', 'Logged Out', 'You have been signed out safely.');
    router.push('/login');
  };

  const hasRole = (roles: RoleName[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        hasRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
