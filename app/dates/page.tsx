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
} from 'lucide-react';

export default function DatesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading simulated dates...</div>}>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight">
            Agent Date Explorer
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Read complete multi-turn transcripts and structured date reports exchanged between autonomous agents ({dates.length} completed dates).
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span className="px-2.5 py-1 rounded-full bg-slate-100 font-medium">
            300 Unique Pairwise Dates Persisted
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search dates by participant name, dialogue snippet, or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-sm"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={selectedParticipantId}
            onChange={(e) => setSelectedParticipantId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-sm"
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

      {/* Main Grid: Date List */}
      {loading ? (
        <div className="text-center p-12 text-slate-500">Loading simulated dates...</div>
      ) : filteredDates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <MessagesSquare className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-semibold text-lg text-slate-900">No dates found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            No simulated date matches the selected filter or query.
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
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-rose-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Pairing Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-rose-500 text-white font-bold text-xs flex items-center justify-center">
                        {pA?.displayName[0] || 'A'}
                      </div>
                      <span className="text-xs font-serif font-bold text-slate-800">
                        {pA?.displayName || 'Agent A'}
                      </span>
                      <span className="text-xs text-rose-500 font-semibold">&amp;</span>
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center justify-center">
                        {pB?.displayName[0] || 'B'}
                      </div>
                      <span className="text-xs font-serif font-bold text-slate-800">
                        {pB?.displayName || 'Agent B'}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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

                  {/* Summary */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {d.structuredReport?.summary}
                  </p>

                  {/* Shared topic badge */}
                  <div className="flex flex-wrap gap-1">
                    {(d.structuredReport?.sharedInterests || []).slice(0, 2).map((interest, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                    <span className="text-[10px] text-slate-400 self-center">
                      ({d.turnsCount || d.transcript.length} turns)
                    </span>
                  </div>
                </div>

                {/* Inspect Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedDate(d)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center space-x-1"
                  >
                    <span>Read Full Transcript</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[10px] text-slate-400">
                    {d.simulationMode === 'gemini' ? 'Gemini LLM' : 'Deterministic'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transcript Modal / Drawer */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center font-bold">
                  <MessagesSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-lg text-slate-900">
                    Simulated Date: {pMap.get(selectedDate.participantAId)?.displayName} &amp; {pMap.get(selectedDate.participantBId)?.displayName}
                  </h2>
                  <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                    <span>{selectedDate.turnsCount} turns</span>
                    <span>•</span>
                    <span className="capitalize">{selectedDate.simulationMode} mode ({selectedDate.modelUsed})</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRerunDate(selectedDate)}
                  disabled={isRerunning}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                  title="Rerun this simulated date"
                >
                  <RefreshCw className={`w-4 h-4 ${isRerunning ? 'animate-spin text-rose-600' : ''}`} />
                </button>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Structured Date Report Box */}
              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                    Structured Date Report
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white text-amber-900 text-xs font-bold border border-amber-200">
                    Engagement: {selectedDate.structuredReport?.conversationalEngagementScore}%
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {selectedDate.structuredReport?.summary}
                </p>

                {selectedDate.structuredReport?.dealbreakerDetected && (
                  <div className="p-3 rounded-xl bg-rose-100/80 border border-rose-300 text-rose-900 text-xs flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Dealbreaker Detected</div>
                      <div>{selectedDate.structuredReport?.dealbreakerDetails}</div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1 text-xs">
                  <span className="text-slate-500 font-semibold">Shared Ground:</span>
                  {(selectedDate.structuredReport?.sharedInterests || []).map((topic, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-white border border-amber-200 text-slate-800 font-medium text-[11px]">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Multi-turn Chat Transcript */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Full Conversation Dialogue
                </h3>

                <div className="space-y-3">
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
                        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mb-1">
                          <span className="font-semibold text-slate-800">{speaker?.displayName || turn.speakerName}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                            {turn.intent}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                            isSpeakerA
                              ? 'bg-slate-100 text-slate-800 rounded-tl-sm'
                              : 'bg-rose-600 text-white rounded-tr-sm shadow-sm'
                          }`}
                        >
                          {turn.message}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
              <span>Synthetic agent conversation model | Auditable research record</span>
              <button
                onClick={() => setSelectedDate(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
