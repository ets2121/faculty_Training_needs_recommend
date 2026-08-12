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
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-white bg-slate-950 text-slate-100 dark:bg-slate-950 dark:text-slate-100">
        <ToastProvider>
          <AuthProvider>
            <ThemeProvider>
              <div className="flex flex-col min-h-screen">
                {/* Fixed top navbar */}
                <Navbar />

                {/* Below navbar: sidebar is fixed, main scrolls */}
                <div className="flex flex-1 pt-0">
                  {/* Sidebar renders its own fixed/mobile positioning */}
                  <Sidebar />

                  {/* Main content: offset by sidebar width on desktop */}
                  <main className="flex-1 md:ml-56 min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
                    <div className="max-w-6xl mx-auto">
                      {children}
                    </div>
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
