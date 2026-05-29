import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Inter_Tight, Fraunces, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/* ─── Google Fonts ──────────────────────────────────────────────────────────── */
const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

const interTight = Inter_Tight({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
});

const fraunces = Fraunces({
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

/* ─── Metadata ──────────────────────────────────────────────────────────────── */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a1410',
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

/* ─── Root layout ───────────────────────────────────────────────────────────── */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${interTight.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
