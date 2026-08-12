import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'QSU Faculty Training Needs Recommender System',
  description: 'Production-ready recommendation portal with MySQL, RBAC, and scikit-learn ML engine.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body className="bg-dark-base text-slate-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
        <ToastProvider>
          <AuthProvider>
            <ThemeProvider>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
                  <Sidebar />
                  <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
                    {children}
                  </main>
                </div>
              </div>
            </ThemeProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
