'use client';

import Link from 'next/link';
import { Participant } from '@/lib/types';

export default function StoryBar({ participants }: { participants: Participant[] }) {
  if (!participants || participants.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 px-2 flex items-center justify-between">
        <span>Active Dating Personas (25 Agents)</span>
        <span className="text-rose-600 font-semibold normal-case text-xs">Tap to view analysis</span>
      </div>

      <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar pb-1 px-1">
        {participants.map((p) => {
          const initials = p.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <Link
              key={p.id}
              href={`/participants/${p.id}`}
              className="flex flex-col items-center space-y-1.5 shrink-0 group focus:outline-none"
            >
              <div className="insta-ring group-hover:scale-105 transition-transform">
                <div className="insta-ring-inner">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-800 to-slate-900 text-white font-bold text-sm flex items-center justify-center">
                    {initials}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-700 group-hover:text-rose-600 transition-colors truncate max-w-[64px] text-center">
                {p.displayName}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
