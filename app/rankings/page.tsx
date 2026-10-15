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
} from 'lucide-react';

export default function RankingsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Calculating compatibility rankings...</div>}>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight">
            Personalized Compatibility Rankings
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Directional alignment scores evaluated from the target participant&apos;s perspective and explicit dealbreakers.
          </p>
        </div>

        {/* Target Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase text-slate-500">Perspective:</span>
          <select
            value={selectedTargetId}
            onChange={(e) => handleTargetChange(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.displayName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Focus Summary Box */}
      {target && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white font-serif font-bold text-xl flex items-center justify-center shadow-sm">
              {target.displayName[0]}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif font-bold text-xl text-slate-900">
                  {target.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                  Target
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl line-clamp-1 italic">
                Stated Goal: &quot;{target.relationshipGoals}&quot;
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs shrink-0">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-400 block font-bold uppercase text-[10px]">Dealbreakers</span>
              <span className="font-semibold text-rose-700">
                {target.dealbreakers && target.dealbreakers.length > 0 ? target.dealbreakers.length : 'None'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-400 block font-bold uppercase text-[10px]">Candidates Evaluated</span>
              <span className="font-semibold text-slate-900">{rankings.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Asymmetry Callout Banner */}
      <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 text-xs text-rose-900 flex items-start space-x-3">
        <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Why Rankings Are Directed &amp; Asymmetric:</strong> Person A ranking Person B evaluates whether Person B satisfies Person A&apos;s goals and avoids Person A&apos;s dealbreakers. If Person A requires a non-smoker but Person B has no such restriction, Person A will rank a smoking partner at 0, while the candidate may rate Person A highly.
        </div>
      </div>

      {/* Candidate Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Filter candidate results by name or rationale..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-sm"
        />
      </div>

      {/* Rankings List */}
      {loading ? (
        <div className="text-center p-12 text-slate-500">Calculating compatibility rankings...</div>
      ) : filteredRankings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          No candidates found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRankings.map((r) => {
            const candidate = pMap.get(r.candidateParticipantId);
            const isDealbreaker = r.dealbreakerTriggered;

            return (
              <div
                key={r.candidateParticipantId}
                className={`bg-white rounded-3xl border p-6 sm:p-7 shadow-sm transition-all space-y-5 ${
                  isDealbreaker
                    ? 'border-rose-200 bg-rose-50/20'
                    : r.overallScore >= 80
                    ? 'border-emerald-200/80 hover:shadow-md'
                    : 'border-slate-200/90 hover:shadow-md'
                }`}
              >
                {/* Top Row: Rank, Candidate Name, Overall Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-serif font-bold text-sm flex items-center justify-center shrink-0">
                      #{r.rank}
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                        {candidate?.displayName[0] || 'C'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-serif font-bold text-lg text-slate-900">
                            {candidate?.name || 'Candidate'}
                          </h3>
                          <span className="text-xs text-slate-500 font-medium">
                            ({candidate?.displayName})
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {candidate?.bio}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Score Pill */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <div
                      className={`px-4 py-2 rounded-2xl flex items-center space-x-2 font-bold ${
                        isDealbreaker
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : r.overallScore >= 80
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      <span className="text-2xl font-serif">{r.overallScore}</span>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">/ 100</span>
                    </div>
                  </div>
                </div>

                {/* Dealbreaker Alert Box if Triggered */}
                {isDealbreaker && (
                  <div className="p-3.5 rounded-2xl bg-rose-100/70 border border-rose-200 text-xs text-rose-900 flex items-start space-x-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Dealbreaker Conflict Triggered (Score Override: 0)</div>
                      <div className="mt-0.5">{r.dealbreakerReasons.join(' ')}</div>
                    </div>
                  </div>
                )}

                {/* Formula Breakdown Progress Bars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium">Interests (35%)</span>
                      <span className="font-bold text-slate-800">{r.breakdown.sharedInterestsScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-600 h-full rounded-full"
                        style={{ width: `${r.breakdown.sharedInterestsScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium">Goals (25%)</span>
                      <span className="font-bold text-slate-800">{r.breakdown.goalsCompatibilityScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-600 h-full rounded-full"
                        style={{ width: `${r.breakdown.goalsCompatibilityScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium">Date Dialogue (20%)</span>
                      <span className="font-bold text-slate-800">{r.breakdown.conversationalScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${r.breakdown.conversationalScore}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500 font-medium">Lifestyle (20%)</span>
                      <span className="font-bold text-slate-800">{r.breakdown.lifestyleScore}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${r.breakdown.lifestyleScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Narrative Rationale */}
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  <strong>Assessment:</strong> {r.narrativeReason}
                </p>

                {/* Shared Interests & Suggested Questions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                      Shared Passions &amp; Synergies
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {r.sharedInterests.length > 0 ? (
                        r.sharedInterests.map((interest, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-medium text-[11px]"
                          >
                            {interest}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">No direct keyword overlap</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                      Suggested Real-World Follow-Up Prompt
                    </span>
                    <p className="text-slate-700 italic text-[11px]">
                      {r.suggestedNextQuestions[0] || '"What is one value that guides your life?"'}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <Link
                    href={`/participants/${r.candidateParticipantId}`}
                    className="font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                  >
                    <span>View Candidate Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/dates?participantId=${target?.id || ''}`}
                    className="font-semibold text-rose-600 hover:text-rose-700 flex items-center space-x-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>View Date Transcript</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
