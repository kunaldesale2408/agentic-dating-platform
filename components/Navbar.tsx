'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeartHandshake, Users, MessagesSquare, Trophy, Sparkles, Settings, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Overview', icon: HeartHandshake },
    { href: '/participants', label: 'Participants', icon: Users },
    { href: '/dates', label: 'Agent Dates', icon: MessagesSquare },
    { href: '/rankings', label: 'Rankings', icon: Trophy },
    { href: '/demo', label: 'Live Demo', icon: Sparkles },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-sm shadow-rose-500/20">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-lg tracking-tight text-slate-900 leading-none">
                  CupidAgent
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-rose-600 mt-0.5">
                  Research Platform
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-rose-50 text-rose-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/participants/new"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-colors shadow-sm shadow-rose-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Participant</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Mobile nav row */}
      <div className="md:hidden border-t border-border/50 px-4 py-2 overflow-x-auto flex items-center space-x-2 bg-slate-50/50">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs whitespace-nowrap ${
                isActive ? 'bg-rose-100 text-rose-800 font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
