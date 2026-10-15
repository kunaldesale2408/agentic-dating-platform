'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Participant } from '@/lib/types';
import {
  Users,
  Search,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Trophy,
  Filter,
} from 'lucide-react';

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'synthetic' | 'custom'>('all');

  useEffect(() => {
    fetchParticipants();
  }, []);

  async function fetchParticipants() {
    try {
      const res = await fetch('/api/participants');
      const data = await res.json();
      if (data.success) {
        setParticipants(data.data);
      }
    } catch (err) {
      console.error('Error fetching participants', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = participants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (p.interests || []).some((i) => i.toLowerCase().includes(search.toLowerCase())) ||
      (p.bio || '').toLowerCase().includes(search.toLowerCase());

    if (filterType === 'synthetic') return matchesSearch && p.isSynthetic;
    if (filterType === 'custom') return matchesSearch && !p.isSynthetic;
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight">
            Participant Directory
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Browse consenting participants and inspected agent personas ({participants.length} registered).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/participants/new"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-colors shadow-sm shadow-rose-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Participant</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, interests, hobbies, or background..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-sm transition-all"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All ({participants.length})
          </button>
          <button
            onClick={() => setFilterType('synthetic')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'synthetic'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Synthetic Demo ({participants.filter((p) => p.isSynthetic).length})
          </button>
          <button
            onClick={() => setFilterType('custom')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterType === 'custom'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Custom Added ({participants.filter((p) => !p.isSynthetic).length})
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-white border border-slate-100 p-6 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-semibold text-lg text-slate-900">No participants found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            No participants match your query &quot;{search}&quot;. Try adjusting your search keywords or filter.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setFilterType('all');
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => {
            const initials = p.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-rose-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar with Avatar & Badge */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-base text-slate-900 leading-tight">
                          {p.name}
                        </h3>
                        <div className="text-xs text-slate-500 font-medium">
                          Agent: <span className="text-rose-600 font-semibold">{p.displayName}</span>
                        </div>
                      </div>
                    </div>

                    {p.isSynthetic ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-semibold text-amber-800">
                        Synthetic Demo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-800 flex items-center space-x-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Verified Consent</span>
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {p.bio}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(p.interests || []).slice(0, 3).map((interest) => (
                      <span
                        key={interest}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                    {(p.interests || []).length > 3 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-400 text-[10px]">
                        +{p.interests.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Relationship Goal Snippet */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Stated Goal
                    </div>
                    <div className="text-xs text-slate-700 font-medium italic line-clamp-2 mt-0.5">
                      &quot;{p.relationshipGoals}&quot;
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <Link
                    href={`/participants/${p.id}`}
                    className="font-semibold text-rose-600 hover:text-rose-700 flex items-center space-x-1"
                  >
                    <span>Inspect Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/rankings?targetId=${p.id}`}
                      title="View Personalized Compatibility Rankings"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/dates?participantId=${p.id}`}
                      title="View Agent Dates"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
