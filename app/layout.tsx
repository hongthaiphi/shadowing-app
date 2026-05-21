import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'ShadowSpeak — English Practice',
  description: 'Improve your English with shadowing and dictation practice',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50 min-h-screen">
        <Navbar />
        <main>{children}</main>
        <footer className="text-center py-8 text-sm text-gray-400 border-t border-gray-100 mt-16 bg-white/50">
          Powered by <span className="font-semibold text-gray-600">ShadowSpeak</span>
        </footer>
      </body>
    </html>
  );
}
