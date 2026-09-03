'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Loader2 } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!loading) {
      if (!user && !isLoginPage) {
        router.replace('/login');
      } else if (user && isLoginPage) {
        router.replace('/');
      }
    }
  }, [user, loading, isLoginPage, router]);

  // Loading state during auth check
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f3f4f6]">
        <div className="text-center space-y-3 p-6 glass-card border border-white/60 shadow-xl">
          <Loader2 className="w-8 h-8 text-primary-green animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-700">Verifying Admin Session...</p>
        </div>
      </div>
    );
  }

  // Login page layout (standalone full page)
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Redirecting unauthenticated user
  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f3f4f6]">
        <div className="text-center space-y-3 p-6 glass-card border border-white/60 shadow-xl">
          <Loader2 className="w-8 h-8 text-primary-green animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-700">Redirecting to Login...</p>
        </div>
      </div>
    );
  }

  // Authenticated Protected App Layout
  return (
    <>
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>
      </div>
    </>
  );
}
