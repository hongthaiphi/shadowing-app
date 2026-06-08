import type { Metadata, Viewport } from 'next';
import { Schibsted_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

/* ─── Google Fonts ──────────────────────────────────────────────────────────── */
const schibstedGrotesk = Schibsted_Grotesk({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-schibsted',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
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
  themeColor: '#ee5e3f',
};

export const metadata: Metadata = {
  title: {
    default: 'Cadence — English Speaking Studio',
    template: '%s | Cadence',
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
      className={`${schibstedGrotesk.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
