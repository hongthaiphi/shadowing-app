import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#6366f1',
};

export const metadata: Metadata = {
  title: {
    default: 'ShadowSpeak — English Practice',
    template: '%s | ShadowSpeak',
  },
  description:
    'Improve your English with shadowing, dictation, reading and writing practice. Perfect for IELTS, TOEIC and everyday fluency.',
  keywords: ['English practice', 'shadowing', 'dictation', 'IELTS', 'pronunciation', 'reading', 'writing'],
  authors: [{ name: 'ShadowSpeak' }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'ShadowSpeak',
    title: 'ShadowSpeak — English Practice',
    description: 'Shadowing, dictation, reading and writing practice to boost your English fluency.',
  },
  twitter: {
    card: 'summary',
    title: 'ShadowSpeak — English Practice',
    description: 'Shadowing, dictation, reading and writing practice to boost your English fluency.',
  },
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
