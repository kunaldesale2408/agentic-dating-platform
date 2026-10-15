import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'CupidAgent | Autonomous Agentic Dating Research Platform',
  description: 'Multi-turn autonomous AI agent dating research platform with verifiable consent, dealbreaker enforcement, and transparent compatibility scoring.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-[#faf8f5] text-slate-800 antialiased selection:bg-rose-100 selection:text-rose-900">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-border/80 bg-white/70 py-8 text-xs text-slate-500 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                <strong>Ethical Experimentation Standard:</strong> Only consented profiles or clearly labeled synthetic demo personas are evaluated. No photo-based inference.
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/demo" className="hover:text-rose-600 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>25-Person Preloaded Demo</span>
              </Link>
              <Link href="/settings" className="hover:text-rose-600">
                Privacy Controls
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
