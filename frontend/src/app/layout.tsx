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
    <html lang="en" className="dark h-full">
      {/*
        h-screen + overflow-hidden on body means the PAGE itself never scrolls.
        Only the <main> region below will have overflow-y-auto and scroll.
      */}
      <body className="h-full overflow-hidden bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        <ToastProvider>
          <AuthProvider>
            <ThemeProvider>
              {/* Full-height column: Navbar on top, then sidebar+main row fills the rest */}
              <div className="flex flex-col h-full">

                {/* ── Navbar: fixed height, never scrolls ── */}
                <Navbar />

                {/* ── Below navbar: sidebar + main, both constrained to remaining height ── */}
                <div className="flex flex-1 overflow-hidden">

                  {/* Sidebar is a normal flex child — it won't scroll with the page */}
                  <Sidebar />

                  {/* Main content: THIS is the only scrollable region */}
                  <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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
