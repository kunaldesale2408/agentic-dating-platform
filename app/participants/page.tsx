'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Participant } from '@/lib/types';
import StoryBar from '@/components/StoryBar';
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
  Instagram,
  Linkedin,
  Heart,
  BadgeCheck,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-1">
            <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
            <span>25 People Found · LinkedIn &amp; Instagram</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight">
            Discover Personas
          </h1>
          <p className="text-slate-600 text-sm">
            Each person is analyzed strictly from two official sources: their public LinkedIn and public Instagram.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/participants/new"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-sm font-semibold transition-all shadow-md shadow-rose-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Person</span>
          </Link>
        </div>
      </div>

      {/* Instagram Story Avatars Bar */}
      <StoryBar participants={participants} />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, interests, hobbies, or background..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-sm transition-all"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All ({participants.length})
          </button>
          <button
            onClick={() => setFilterType('synthetic')}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
              filterType === 'synthetic'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Synthetic Demo ({participants.filter((p) => p.isSynthetic).length})
          </button>
          <button
            onClick={() => setFilterType('custom')}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
              filterType === 'custom'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Custom ({participants.filter((p) => !p.isSynthetic).length})
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 rounded-3xl bg-white border border-slate-100 p-6 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-semibold text-lg text-slate-900">No participants found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            No profiles match your search &quot;{search}&quot;.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setFilterType('all');
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
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

            const igHandle = p.instagramUrl.split('/').filter(Boolean).pop() || 'instagram';

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-pink-300 p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-4">
                  {/* Top Bar with Avatar & Social Badges */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div className="insta-ring">
                        <div className="insta-ring-inner">
                          <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                            {initials}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h3 className="font-serif font-bold text-lg text-slate-900 leading-tight">
                            {p.displayName}
                          </h3>
                          <BadgeCheck className="w-4 h-4 text-sky-500 fill-sky-500" />
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                          @{igHandle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <a
                        href={p.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors"
                        title="Public Instagram Profile"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={p.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="LinkedIn Profile"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {p.bio}
                  </p>

                  {/* Core 3: Needs · Hobbies · Interests */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">
                        Needs:
                      </span>
                      <p className="text-slate-800 font-medium line-clamp-1 italic text-[11px] mt-0.5">
                        &quot;{p.relationshipGoals}&quot;
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Interests &amp; Hobbies:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {[...(p.interests || []), ...(p.hobbies || [])].slice(0, 4).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <Link
                    href={`/participants/${p.id}`}
                    className="font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1"
                  >
                    <span>View Profile Analysis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/rankings?targetId=${p.id}`}
                      title="See Who Fits Best"
                      className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors"
                    >
                      <Trophy className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/dates?participantId=${p.id}`}
                      title="Watch Agent Date"
                      className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
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
