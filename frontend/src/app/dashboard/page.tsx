'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        if (user.role === 'faculty') router.push('/faculty-dashboard');
        else if (user.role === 'department_admin') router.push('/dept-dashboard');
        else if (user.role === 'campus_admin') router.push('/campus-dashboard');
        else if (user.role === 'system_admin') router.push('/admin-dashboard');
        else router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="w-10 h-10 border-4 border-brand-green/30 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-xs text-light-text dark:text-dark-muted font-mono">Routing to your portal dashboard...</p>
    </div>
  );
}
