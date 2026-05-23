import type { Metadata } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: '400',
});

export const metadata: Metadata = {
  title: 'Forma — Product Configurator Platform',
  description: 'Build embeddable product configurators that generate qualified leads with pricing and PDF quotes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
