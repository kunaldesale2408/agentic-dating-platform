'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Participant, DirectedRanking } from '@/lib/types';
import {
  Trophy,
  Search,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  Heart,
  MessageSquare,
  AlertCircle,
  Info,
  CheckCircle2,
  BadgeCheck,
  Flame,
  Star,
} from 'lucide-react';

export default function RankingsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium">Calculating compatibility rankings...</div>}>
      <RankingsContent />
    </Suspense>
  );
}

function RankingsContent() {
  const searchParams = useSearchParams();
  const initialTargetId = searchParams.get('targetId') || '';

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(initialTargetId);
  const [target, setTarget] = useState<Participant | null>(null);
  const [rankings, setRankings] = useState<DirectedRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchParticipants();
  }, []);

  async function fetchParticipants() {
    try {
      const res = await fetch('/api/participants');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setParticipants(data.data);
        const defaultId = initialTargetId || data.data[0].id;
        setSelectedTargetId(defaultId);
        fetchRankings(defaultId);
      }
    } catch (err) {
      console.error('Error fetching participants', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRankings(targetId: string) {
    if (!targetId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rankings?targetId=${targetId}`);
      const data = await res.json();
      if (data.success) {
        setTarget(data.target);
        setRankings(data.rankings);
      }
    } catch (err) {
      console.error('Error fetching rankings', err);
    } finally {
      setLoading(false);
    }
  }

  function handleTargetChange(id: string) {
    setSelectedTargetId(id);
    fetchRankings(id);
  }

  const pMap = new Map<string, Participant>();
  for (const p of participants) {
    pMap.set(p.id, p);
  }

  const filteredRankings = rankings.filter((r) => {
    if (!searchQuery.trim()) return true;
    const cand = pMap.get(r.candidateParticipantId);
    return (
      (cand?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cand?.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.narrativeReason.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-1">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>Personalized Rankings · Who Fits Best</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight">
            Compatibility Leaderboard
          </h1>
          <p className="text-slate-600 text-sm">
            Directional rankings evaluating who fits {target?.displayName || 'the person'} best, respecting their explicit needs and dealbreakers.
          </p>
        </div>

        {/* Perspective Picker */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase text-slate-500">Ranking for:</span>
          <select
            value={selectedTargetId}
            onChange={(e) => handleTargetChange(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName} ({p.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Person Focus Card */}
      {target && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="insta-ring">
              <div className="insta-ring-inner">
                <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-serif font-bold text-xl flex items-center justify-center">
                  {target.displayName[0]}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif font-bold text-xl text-slate-900">
                  {target.name}
                </h2>
                <BadgeCheck className="w-4 h-4 text-sky-500 fill-sky-500" />
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl italic line-clamp-1">
                Stated Need: &quot;{target.relationshipGoals}&quot;
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs shrink-0">
            <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/60">
              <span className="text-rose-600 block font-bold uppercase text-[10px]">Boundaries</span>
              <span className="font-bold text-slate-900">
                {target.dealbreakers && target.dealbreakers.length > 0 ? `${target.dealbreakers.length} Dealbreakers` : 'None'}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block font-bold uppercase text-[10px]">Candidates Ranked</span>
              <span className="font-bold text-slate-900">{rankings.length} Agents</span>
            </div>
          </div>
        </div>
      )}

      {/* Asymmetry Callout Banner */}
      <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 text-xs text-slate-700 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Directional Matching:</strong> Rankings are calculated from {target?.displayName}&apos;s perspective. If a candidate triggers {target?.displayName}&apos;s dealbreakers, their score drops to 0, while the candidate may rate {target?.displayName} differently.
        </div>
      </div>

      {/* Candidate Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Filter ranked matches by name, passion, or assessment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-sm"
        />
      </div>

      {/* Match Cards List (Dating App Style) */}
      {loading ? (
        <div className="text-center p-12 text-slate-500 font-medium">Evaluating compatibility matrices...</div>
      ) : filteredRankings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500">
          No candidates match your search.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRankings.map((r) => {
            const candidate = pMap.get(r.candidateParticipantId);
            const isDealbreaker = r.dealbreakerTriggered;
            const isTopMatch = r.rank <= 3 && !isDealbreaker;

            return (
              <div
                key={r.candidateParticipantId}
                className={`bg-white rounded-3xl border p-6 sm:p-7 shadow-sm transition-all space-y-4 ${
                  isDealbreaker
                    ? 'border-rose-200 bg-rose-50/20'
                    : isTopMatch
                    ? 'border-amber-300 ring-2 ring-amber-400/20 shadow-md'
                    : 'border-slate-200 hover:shadow-md'
                }`}
              >
                {/* Top Row: Rank Badge, Candidate Header, Score Meter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-9 h-9 rounded-2xl font-serif font-bold text-xs flex items-center justify-center shrink-0 ${
                        isTopMatch
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      #{r.rank}
                    </div>

                    <div className="flex items-center space-x-3.5">
                      <div className="insta-ring">
                        <div className="insta-ring-inner">
                          <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                            {candidate?.displayName[0] || 'C'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-serif font-bold text-lg text-slate-900">
                            {candidate?.displayName}
                          </h3>
                          <span className="text-xs text-slate-400 font-normal">
                            ({candidate?.name})
                          </span>
                          {isTopMatch && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center space-x-1">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>Top Match</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {candidate?.bio}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Compatibility Score Circle */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <div
                      className={`px-4 py-2 rounded-2xl flex items-center space-x-1.5 font-bold ${
                        isDealbreaker
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : r.overallScore >= 80
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span className="text-2xl font-serif">{r.overallScore}%</span>
                      <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
                        {isDealbreaker ? 'Blocked' : 'Match'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dealbreaker Notice */}
                {isDealbreaker && (
                  <div className="p-3.5 rounded-2xl bg-rose-100/70 border border-rose-200 text-xs text-rose-900 flex items-start space-x-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Dealbreaker Conflict Triggered:</div>
                      <div className="mt-0.5">{r.dealbreakerReasons.join(' ')}</div>
                    </div>
                  </div>
                )}

                {/* 4 Factor Breakdown Bars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                  <div>
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                      <span>Interests (35%)</span>
                      <span className="text-slate-800">{r.breakdown.sharedInterestsScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${r.breakdown.sharedInterestsScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                      <span>Goals (25%)</span>
                      <span className="text-slate-800">{r.breakdown.goalsCompatibilityScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${r.breakdown.goalsCompatibilityScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                      <span>Date Dialogue (20%)</span>
                      <span className="text-slate-800">{r.breakdown.conversationalScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: `${r.breakdown.conversationalScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                      <span>Lifestyle (20%)</span>
                      <span className="text-slate-800">{r.breakdown.lifestyleScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${r.breakdown.lifestyleScore}%` }} />
                    </div>
                  </div>
                </div>

                {/* Narrative Assessment */}
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  <strong>Assessment:</strong> {r.narrativeReason}
                </p>

                {/* Hinge Style Suggested Icebreaker */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-600">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                      Icebreaker Prompt:
                    </span>
                    <span className="italic text-[11px] text-slate-800">
                      {r.suggestedNextQuestions[0] || '"What is one value that guides your life?"'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0">
                    <Link
                      href={`/participants/${r.candidateParticipantId}`}
                      className="font-bold text-slate-700 hover:text-slate-900 flex items-center space-x-1"
                    >
                      <span>Profile</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>

                    <Link
                      href={`/dates?participantId=${target?.id || ''}`}
                      className="font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Date Transcript</span>
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
