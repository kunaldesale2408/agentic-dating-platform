'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Participant, SimulatedDate } from '@/lib/types';
import {
  MessagesSquare,
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Clock,
  RefreshCw,
  X,
  MessageCircle,
  HelpCircle,
  Layers,
  Heart,
  BadgeCheck,
} from 'lucide-react';

export default function DatesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium">Loading simulated dates...</div>}>
      <DatesContent />
    </Suspense>
  );
}

function DatesContent() {
  const searchParams = useSearchParams();
  const initialParticipantId = searchParams.get('participantId') || '';

  const [dates, setDates] = useState<SimulatedDate[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(initialParticipantId);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<SimulatedDate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRerunning, setIsRerunning] = useState(false);

  useEffect(() => {
    fetchInitial();
  }, []);

  async function fetchInitial() {
    try {
      const [datesRes, pRes] = await Promise.all([
        fetch('/api/dates'),
        fetch('/api/participants'),
      ]);

      const datesData = await datesRes.json();
      const pData = await pRes.json();

      if (datesData.success) {
        setDates(datesData.data);
      }
      if (pData.success) {
        setParticipants(pData.data);
      }
    } catch (err) {
      console.error('Error fetching dates', err);
    } finally {
      setLoading(false);
    }
  }

  const pMap = new Map<string, Participant>();
  for (const p of participants) {
    pMap.set(p.id, p);
  }

  const filteredDates = dates.filter((d) => {
    if (selectedParticipantId && d.participantAId !== selectedParticipantId && d.participantBId !== selectedParticipantId) {
      return false;
    }
    if (!search.trim()) return true;

    const pA = pMap.get(d.participantAId);
    const pB = pMap.get(d.participantBId);
    const textToMatch = `${pA?.name || ''} ${pB?.name || ''} ${d.structuredReport?.summary || ''} ${d.transcript.map((t) => t.message).join(' ')}`.toLowerCase();
    return textToMatch.includes(search.toLowerCase());
  });

  async function handleRerunDate(date: SimulatedDate) {
    setIsRerunning(true);
    try {
      const res = await fetch('/api/dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantAId: date.participantAId,
          participantBId: date.participantBId,
          forceRerun: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDates((prev) => prev.map((d) => (d.id === data.data.id ? data.data : d)));
        setSelectedDate(data.data);
      } else {
        alert(data.error || 'Failed to rerun');
      }
    } catch (err) {
      alert('Error rerunning simulation');
    } finally {
      setIsRerunning(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-xs font-semibold mb-1">
            <Heart className="w-3.5 h-3.5 fill-pink-600 text-pink-600" />
            <span>Agent-to-Agent Date Transcripts</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight">
            Watch Agents Dating
          </h1>
          <p className="text-slate-600 text-sm">
            Real multi-turn date dialogues where agents converse, ask follow-up questions, and evaluate chemistry on each person&apos;s behalf.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span className="px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs font-semibold text-slate-700">
            {dates.length} Dates Completed
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search dates by participant name or conversation topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-sm"
          />
        </div>

        <div className="sm:w-72">
          <select
            value={selectedParticipantId}
            onChange={(e) => setSelectedParticipantId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-sm"
          >
            <option value="">All Participants ({participants.length})</option>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.displayName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Cards Grid */}
      {loading ? (
        <div className="text-center p-12 text-slate-500">Loading simulated dates...</div>
      ) : filteredDates.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <MessagesSquare className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-semibold text-lg text-slate-900">No dates found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            No simulated date matches your selected filter.
          </p>
          <button
            onClick={() => {
              setSelectedParticipantId('');
              setSearch('');
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDates.slice(0, 60).map((d) => {
            const pA = pMap.get(d.participantAId);
            const pB = pMap.get(d.participantBId);

            const hasDealbreaker = d.structuredReport?.dealbreakerDetected;
            const engagement = d.structuredReport?.conversationalEngagementScore ?? 65;

            return (
              <div
                key={d.id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-pink-300 p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-4">
                  {/* Pairing Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="insta-ring">
                        <div className="insta-ring-inner">
                          <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                            {pA?.displayName[0] || 'A'}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-slate-900">
                        {pA?.displayName}
                      </span>
                      <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                      <span className="text-xs font-bold text-slate-900">
                        {pB?.displayName}
                      </span>

                      <div className="insta-ring">
                        <div className="insta-ring-inner">
                          <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                            {pB?.displayName[0] || 'B'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        hasDealbreaker
                          ? 'bg-rose-100 text-rose-800'
                          : engagement >= 80
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {hasDealbreaker ? 'Dealbreaker' : `${engagement}% Vibe`}
                    </span>
                  </div>

                  {/* Date Summary */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {d.structuredReport?.summary}
                  </p>

                  {/* Shared Topics Pill */}
                  <div className="flex flex-wrap gap-1">
                    {(d.structuredReport?.sharedInterests || []).slice(0, 2).map((interest, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-800 text-[10px] font-semibold"
                      >
                        {interest}
                      </span>
                    ))}
                    <span className="text-[10px] text-slate-400 self-center">
                      ({d.turnsCount || d.transcript.length} turns exchanged)
                    </span>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedDate(d)}
                    className="text-xs font-bold text-rose-600 group-hover:text-rose-700 flex items-center space-x-1"
                  >
                    <span>Read Chat Transcript</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[10px] text-slate-400 font-medium">
                    {d.simulationMode === 'gemini' ? 'Gemini LLM' : 'Autonomous Agent'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Instagram DM Style Transcript Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header (Instagram DM Header Style) */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-3">
                <div className="flex -space-x-3">
                  <div className="insta-ring">
                    <div className="insta-ring-inner">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        {pMap.get(selectedDate.participantAId)?.displayName[0]}
                      </div>
                    </div>
                  </div>
                  <div className="insta-ring">
                    <div className="insta-ring-inner">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                        {pMap.get(selectedDate.participantBId)?.displayName[0]}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-1.5">
                    <h2 className="font-bold text-sm text-slate-900">
                      {pMap.get(selectedDate.participantAId)?.displayName} &amp; {pMap.get(selectedDate.participantBId)?.displayName}
                    </h2>
                    <BadgeCheck className="w-4 h-4 text-sky-500 fill-sky-500" />
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Active Simulated Date ({selectedDate.turnsCount} turns)
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRerunDate(selectedDate)}
                  disabled={isRerunning}
                  className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  title="Rerun this simulated date"
                >
                  <RefreshCw className={`w-4 h-4 ${isRerunning ? 'animate-spin text-rose-600' : ''}`} />
                </button>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Report & Messages */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/40">
              {/* Structured Date Report Box */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    Date Analysis &amp; Chemistry Report
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 text-xs font-bold">
                    {selectedDate.structuredReport?.conversationalEngagementScore}% Chemistry
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {selectedDate.structuredReport?.summary}
                </p>

                {selectedDate.structuredReport?.dealbreakerDetected && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Dealbreaker Detected:</div>
                      <div>{selectedDate.structuredReport?.dealbreakerDetails}</div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 self-center font-semibold">Shared:</span>
                  {(selectedDate.structuredReport?.sharedInterests || []).map((topic, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Chat Dialogue Bubbles (Instagram DM Look) */}
              <div className="space-y-4">
                <div className="text-center">
                  <span className="px-3 py-1 rounded-full bg-slate-200/70 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Simulated Date Dialogue
                  </span>
                </div>

                <div className="space-y-3.5">
                  {selectedDate.transcript.map((turn, i) => {
                    const isSpeakerA = turn.speakerId === selectedDate.participantAId;
                    const speaker = isSpeakerA
                      ? pMap.get(selectedDate.participantAId)
                      : pMap.get(selectedDate.participantBId);

                    return (
                      <div
                        key={i}
                        className={`flex flex-col ${isSpeakerA ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mb-1 px-1">
                          <span className="font-bold text-slate-700">{speaker?.displayName}</span>
                          <span>•</span>
                          <span className="capitalize">{turn.intent.replace('_', ' ')}</span>
                        </div>

                        <div className="relative group max-w-[82%]">
                          <div
                            className={`p-3.5 rounded-3xl text-xs leading-relaxed ${
                              isSpeakerA
                                ? 'bg-white text-slate-900 border border-slate-200/80 shadow-2xs rounded-bl-sm'
                                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white shadow-md rounded-br-sm'
                            }`}
                          >
                            {turn.message}
                          </div>

                          {/* Heart micro-badge */}
                          <div className={`absolute -bottom-1.5 ${isSpeakerA ? '-right-1.5' : '-left-1.5'} bg-white rounded-full p-0.5 shadow-xs border border-slate-100`}>
                            <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-400 px-6">
              <span>Auditable agent dating record</span>
              <button
                onClick={() => setSelectedDate(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
