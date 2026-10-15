'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Participant } from '@/lib/types';
import { buildAgentPersona } from '@/lib/agent-simulator';
import {
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  Trash2,
  Sparkles,
  Trophy,
  MessageSquare,
  AlertTriangle,
  HelpCircle,
  FileText,
  User,
  Heart,
  Ban,
  Clock,
  Layers,
} from 'lucide-react';

export default function ParticipantDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatingWith, setSimulatingWith] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  async function fetchData() {
    try {
      const [pRes, allRes] = await Promise.all([
        fetch(`/api/participants/${params.id}`),
        fetch('/api/participants'),
      ]);

      const pData = await pRes.json();
      const allData = await allRes.json();

      if (pData.success) {
        setParticipant(pData.data);
      }
      if (allData.success) {
        setAllParticipants(allData.data.filter((p: Participant) => p.id !== params.id));
      }
    } catch (err) {
      console.error('Error fetching participant detail', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this participant and all their associated simulated dates and rankings?')) {
      return;
    }

    try {
      const res = await fetch(`/api/participants/${params.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.push('/participants');
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert('Error deleting participant');
    }
  }

  async function handleSimulateDate() {
    if (!simulatingWith) return;
    setIsSimulating(true);

    try {
      const res = await fetch('/api/dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantAId: params.id,
          participantBId: simulatingWith,
          forceRerun: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/dates?participantId=${params.id}`);
      } else {
        alert(data.error || 'Simulation failed');
      }
    } catch (err) {
      alert('Simulation error');
    } finally {
      setIsSimulating(false);
    }
  }

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading participant analysis...</div>;
  }

  if (!participant) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Participant Not Found</h2>
        <Link href="/participants" className="text-rose-600 font-semibold text-sm">
          Return to Directory
        </Link>
      </div>
    );
  }

  const personaPrompt = buildAgentPersona(participant);

  return (
    <div className="space-y-8">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/participants"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Directory</span>
        </Link>

        <div className="flex items-center space-x-3">
          <Link
            href={`/rankings?targetId=${participant.id}`}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-semibold transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>Personalized Rankings</span>
          </Link>

          <button
            onClick={handleDelete}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white font-serif font-bold text-2xl flex items-center justify-center shadow-sm">
              {participant.displayName[0]}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                  {participant.name}
                </h1>
                {participant.isSynthetic ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                    Synthetic Demo
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Consent</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Represented by AI Agent: <strong className="text-slate-800 font-semibold">{participant.displayName}</strong> | Registered on {new Date(participant.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-2">
            <a
              href={participant.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            >
              <span>LinkedIn</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <a
              href={participant.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            >
              <span>Instagram</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Bio & Attributes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Verified Profile Bio
              </h3>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                {participant.bio}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Interests & Passions
              </h3>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(participant.interests || []).map((item) => (
                  <span
                    key={item}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 text-xs font-medium border border-rose-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Hobbies & Downtime
              </h3>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(participant.hobbies || []).map((item) => (
                  <span
                    key={item}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Communication Style Card */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Communication Profile
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Style:</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {participant.communicationPreferences?.style}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Pace:</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {participant.communicationPreferences?.pace}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Humor:</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {participant.communicationPreferences?.humor}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Goals & Dealbreakers Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
            <div className="flex items-center space-x-2 text-amber-900 font-semibold text-xs">
              <Heart className="w-4 h-4 text-amber-600" />
              <span>Explicit Relationship Goals</span>
            </div>
            <p className="text-xs text-amber-900 font-medium leading-relaxed italic">
              &quot;{participant.relationshipGoals}&quot;
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-2">
            <div className="flex items-center space-x-2 text-rose-900 font-semibold text-xs">
              <Ban className="w-4 h-4 text-rose-600" />
              <span>Non-Negotiable Dealbreakers</span>
            </div>
            {participant.dealbreakers && participant.dealbreakers.length > 0 ? (
              <ul className="text-xs text-rose-800 space-y-1 list-disc list-inside">
                {participant.dealbreakers.map((db, i) => (
                  <li key={i}>{db}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-rose-700 italic">None specified</p>
            )}
          </div>
        </div>
      </div>

      {/* Evidence & Attribution Drawer */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
            Source Attribution & Audit Trail
          </span>
          <h2 className="font-serif text-2xl font-bold text-slate-900 mt-1">
            Verified Evidence & Grounding
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Every attribute injected into this agent persona is backed by verified evidence items with extraction timestamps and confidence scores.
          </p>
        </div>

        <div className="space-y-3">
          {participant.evidence && participant.evidence.length > 0 ? (
            participant.evidence.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ev.source === 'linkedin'
                          ? 'bg-blue-100 text-blue-800'
                          : ev.source === 'instagram'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {ev.source.replace('_', ' ')}
                    </span>
                    <span className="font-semibold text-slate-900">{ev.claim}</span>
                  </div>
                  {ev.snippet && (
                    <div className="text-slate-500 italic font-serif text-[11px]">
                      &quot;{ev.snippet}&quot;
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] text-slate-400">Confidence:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {Math.round(ev.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400 italic">No specific evidence records registered.</div>
          )}
        </div>

        {/* Known Unknowns & Uncertainties */}
        {participant.unknowns && participant.unknowns.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/60 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-900">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Known Unknowns & Limitations</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              In accordance with data minimization, the following aspects were not supplied and remain neutral in scoring:
            </p>
            <ul className="text-xs text-amber-900 list-disc list-inside space-y-0.5">
              {participant.unknowns.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Agent Simulation Action Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Agent Simulator
            </span>
            <h2 className="font-serif text-2xl font-bold text-slate-900 mt-1">
              Simulate Live Date With Another Agent
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Launch an immediate 6-turn date conversation between {participant.displayName}&apos;s agent and another candidate.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={simulatingWith}
              onChange={(e) => setSimulatingWith(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="">Select candidate partner...</option>
              {allParticipants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.displayName})
                </option>
              ))}
            </select>

            <button
              onClick={handleSimulateDate}
              disabled={!simulatingWith || isSimulating}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-sm transition-colors disabled:opacity-50 flex items-center space-x-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'Simulating...' : 'Run Date'}</span>
            </button>
          </div>
        </div>

        {/* Persona Prompt toggle */}
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={() => setPersonaOpen(!personaOpen)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{personaOpen ? 'Hide Agent Persona Prompt' : 'View Generated Agent Persona Prompt'}</span>
          </button>

          {personaOpen && (
            <pre className="mt-3 p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
              {personaPrompt}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
