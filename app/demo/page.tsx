'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Participant, SimulatedDate, DirectedRanking, SimulationJobProgress } from '@/lib/types';
import {
  Sparkles,
  Trophy,
  Users,
  MessagesSquare,
  ShieldCheck,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  Heart,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export default function DemoPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [dates, setDates] = useState<SimulatedDate[]>([]);
  const [rankings, setRankings] = useState<Record<string, DirectedRanking[]>>({});
  const [progress, setProgress] = useState<SimulationJobProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isQueueRunning, setIsQueueRunning] = useState(false);
  const [concurrency, setConcurrency] = useState(5);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchDemoData();
    const interval = setInterval(pollProgress, 1500);
    return () => clearInterval(interval);
  }, []);

  async function fetchDemoData() {
    try {
      const [pRes, dRes, rRes, progRes] = await Promise.all([
        fetch('/api/participants'),
        fetch('/api/dates'),
        fetch('/api/rankings'),
        fetch('/api/simulate-batch'),
      ]);

      const pData = await pRes.json();
      const dData = await dRes.json();
      const rData = await rRes.json();
      const progData = await progRes.json();

      if (pData.success) setParticipants(pData.data);
      if (dData.success) setDates(dData.data);
      if (rData.success) setRankings(rData.data);
      if (progData.success) {
        setProgress(progData.data);
        setIsQueueRunning(progData.data.isRunning);
      }
    } catch (err) {
      console.error('Error fetching demo data', err);
    } finally {
      setLoading(false);
    }
  }

  async function pollProgress() {
    try {
      const res = await fetch('/api/simulate-batch');
      const data = await res.json();
      if (data.success) {
        setProgress(data.data);
        setIsQueueRunning(data.data.isRunning);
        if (data.data.status === 'completed' && isQueueRunning) {
          fetchDemoData();
        }
      }
    } catch (err) {
      // quiet poll
    }
  }

  async function handleStartBatch() {
    try {
      setIsQueueRunning(true);
      const res = await fetch('/api/simulate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concurrency, mode: 'deterministic' }),
      });
      const data = await res.json();
      if (data.success) {
        setProgress(data.data);
      }
    } catch (err) {
      alert('Failed to start batch simulation');
    }
  }

  async function handleCancelBatch() {
    try {
      await fetch('/api/simulate-batch', { method: 'DELETE' });
      setIsQueueRunning(false);
    } catch (err) {
      alert('Failed to cancel batch');
    }
  }

  async function handleResetDemo() {
    if (!confirm('Reset dataset back to the pristine 25 synthetic participants, 300 dates, and 600 rankings?')) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchDemoData();
        alert('Demo dataset successfully restored!');
      }
    } catch (err) {
      alert('Error resetting demo');
    } finally {
      setResetting(false);
    }
  }

  // Find top compatible pairings
  const topPairings: { pA: Participant; pB: Participant; scoreA: number; scoreB: number; avg: number }[] = [];
  const processedPairs = new Set<string>();

  for (const targetId in rankings) {
    const list = rankings[targetId] || [];
    for (const r of list) {
      const candId = r.candidateParticipantId;
      const sortedKey = [targetId, candId].sort().join('_');
      if (!processedPairs.has(sortedKey) && !r.dealbreakerTriggered) {
        processedPairs.add(sortedKey);
        const reverseList = rankings[candId] || [];
        const reverseR = reverseList.find((x) => x.candidateParticipantId === targetId);
        if (reverseR && !reverseR.dealbreakerTriggered) {
          const pA = participants.find((p) => p.id === targetId);
          const pB = participants.find((p) => p.id === candId);
          if (pA && pB) {
            topPairings.push({
              pA,
              pB,
              scoreA: r.overallScore,
              scoreB: reverseR.overallScore,
              avg: Math.round((r.overallScore + reverseR.overallScore) / 2),
            });
          }
        }
      }
    }
  }

  topPairings.sort((a, b) => b.avg - a.avg);

  const completedPct = progress
    ? Math.round((progress.completedPairs / (progress.totalPairs || 300)) * 100)
    : 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Precomputed Demonstration Environment</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight">
            25-Person Completed Research Demo
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Instantly opens to a fully preloaded 25-person experiment: all 300 pairwise simulated dates and 600 directed rankings are persisted.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-3xl font-serif font-bold text-slate-900">{participants.length}</div>
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">Participants (N)</div>
          <p className="text-[11px] text-slate-400">100% auditable synthetic personas</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-3xl font-serif font-bold text-rose-600">{dates.length}</div>
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">Simulated Dates (N(N-1)/2)</div>
          <p className="text-[11px] text-slate-400">300 unique pairs fully persisted</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-3xl font-serif font-bold text-amber-600">
            {Object.values(rankings).reduce((sum, r) => sum + r.length, 0)}
          </div>
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">Directed Rankings (N(N-1))</div>
          <p className="text-[11px] text-slate-400">24 evaluations per participant</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-3xl font-serif font-bold text-emerald-600">100%</div>
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">Audit Compliance</div>
          <p className="text-[11px] text-slate-400">Zero sensitive inferences made</p>
        </div>
      </div>

      {/* Queue Simulator Controller Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Bounded Concurrency Simulation Queue
            </span>
            <h2 className="font-serif text-2xl font-bold text-slate-900 mt-1">
              Batch Date Simulation Engine
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Re-execute or resume all 300 pairwise agent dates with regulated concurrency limits, retry safety, and real-time progress persistence.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <span>Concurrency:</span>
              <select
                value={concurrency}
                onChange={(e) => setConcurrency(parseInt(e.target.value, 10))}
                disabled={isQueueRunning}
                className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
              >
                <option value={1}>1 worker</option>
                <option value={5}>5 workers (default)</option>
                <option value={10}>10 workers</option>
                <option value={20}>20 workers</option>
              </select>
            </div>

            {isQueueRunning ? (
              <button
                onClick={handleCancelBatch}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Batch</span>
              </button>
            ) : (
              <button
                onClick={handleStartBatch}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm shadow-rose-600/20"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Rerun 300 Dates</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-700">
              {isQueueRunning ? (
                <span className="flex items-center space-x-1.5 text-rose-600">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Simulating: {progress?.currentPair || 'Queue active...'}</span>
                </span>
              ) : (
                <span>Status: <strong className="capitalize text-slate-900">{progress?.status || 'Completed'}</strong></span>
              )}
            </span>
            <span className="font-mono font-bold text-slate-800">
              {progress?.completedPairs || 300} / {progress?.totalPairs || 300} pairs ({completedPct}%)
            </span>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isQueueRunning ? 'bg-gradient-to-r from-rose-500 to-amber-500 animate-pulse' : 'bg-emerald-600'
              }`}
              style={{ width: `${completedPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top Compatibility Matches Spotlight */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Research Findings
            </span>
            <h2 className="font-serif text-2xl font-bold text-slate-900 mt-1">
              Top Mutual Compatibility Pairings
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Pairs where both agents scored each other above 80% without triggering dealbreakers.
            </p>
          </div>

          <Link
            href="/rankings"
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center space-x-1"
          >
            <span>See All Rankings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topPairings.slice(0, 3).map((match, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-gradient-to-b from-rose-50/40 to-white border border-rose-100 space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-500 text-white font-bold text-xs flex items-center justify-center">
                    {match.pA.displayName[0]}
                  </div>
                  <span className="text-xs font-serif font-bold text-slate-900">
                    {match.pA.displayName}
                  </span>
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center justify-center">
                    {match.pB.displayName[0]}
                  </div>
                  <span className="text-xs font-serif font-bold text-slate-900">
                    {match.pB.displayName}
                  </span>
                </div>

                <div className="px-2.5 py-1 rounded-xl bg-white border border-rose-200 text-xs font-serif font-bold text-rose-700">
                  {match.avg}%
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <div>
                  <strong>{match.pA.displayName}&apos;s score for {match.pB.displayName}:</strong> {match.scoreA}%
                </div>
                <div>
                  <strong>{match.pB.displayName}&apos;s score for {match.pA.displayName}:</strong> {match.scoreB}%
                </div>
              </div>

              <div className="pt-2 border-t border-rose-100/80 flex items-center justify-between text-xs">
                <Link
                  href={`/dates?participantId=${match.pA.id}`}
                  className="font-semibold text-rose-600 hover:text-rose-700 flex items-center space-x-1"
                >
                  <span>Read Date</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <Link
                  href={`/rankings?targetId=${match.pA.id}`}
                  className="text-slate-500 hover:text-slate-800 text-[11px]"
                >
                  Inspect Breakdown
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
