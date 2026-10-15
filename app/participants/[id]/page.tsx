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
  Instagram,
  Linkedin,
  BadgeCheck,
  Compass,
  Smile,
  Sparkle,
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
    if (!confirm('Are you sure you want to delete this participant and all associated simulated dates and rankings?')) {
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
    return <div className="p-12 text-center text-slate-500 font-medium">Reading profile and analyzing sources...</div>;
  }

  if (!participant) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Participant Not Found</h2>
        <Link href="/participants" className="text-rose-600 font-semibold text-sm">
          Return to Directory
        </Link>
      </div>
    );
  }

  const personaPrompt = buildAgentPersona(participant);
  const igHandle = participant.instagramUrl.split('/').filter(Boolean).pop() || 'instagram';

  const linkedinEvidence = (participant.evidence || []).filter((e) => e.source === 'linkedin');
  const instagramEvidence = (participant.evidence || []).filter((e) => e.source === 'instagram');
  const participantEvidence = (participant.evidence || []).filter((e) => e.source === 'participant_provided');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 text-xs font-bold transition-all shadow-sm"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>View Compatibility Rankings</span>
          </Link>

          <button
            onClick={handleDelete}
            className="inline-flex items-center space-x-1 px-3 py-2 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Instagram-Style Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-5">
            <div className="insta-ring">
              <div className="insta-ring-inner">
                <div className="w-20 h-20 rounded-full bg-slate-900 text-white font-serif font-bold text-2xl flex items-center justify-center">
                  {participant.displayName[0]}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
                  {participant.name}
                </h1>
                <BadgeCheck className="w-5 h-5 text-sky-500 fill-sky-500" />
              </div>
              <div className="text-xs text-slate-500 font-medium flex items-center space-x-2">
                <span>@{igHandle}</span>
                <span>•</span>
                <span>Represented by Agent <strong className="text-slate-800">{participant.displayName}</strong></span>
              </div>
            </div>
          </div>

          {/* The Two Official Sources */}
          <div className="flex flex-col sm:items-end space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Two Official Sources Analyzed
            </span>
            <div className="flex items-center space-x-2">
              <a
                href={participant.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 text-white text-xs font-semibold shadow-sm hover:opacity-95"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Instagram Profile</span>
                <ExternalLink className="w-3 h-3 text-white/80" />
              </a>

              <a
                href={participant.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0077b5] text-white text-xs font-semibold shadow-sm hover:opacity-95"
              >
                <Linkedin className="w-3.5 h-3.5" />
                <span>LinkedIn Profile</span>
                <ExternalLink className="w-3 h-3 text-white/80" />
              </a>
            </div>
          </div>
        </div>

        {/* Bio from Agent Analysis */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Agent Persona Summary
          </span>
          <p className="text-sm text-slate-700 mt-1 leading-relaxed font-normal">
            {participant.bio}
          </p>
        </div>
      </div>

      {/* CORE 3 PROMPT CARDS: Needs · Hobbies · Interests (Hinge-Style) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-slate-900">
            Agent Profile Analysis
          </h2>
          <span className="text-xs text-rose-600 font-semibold">Needs · Hobbies · Interests</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Needs */}
          <div className="hinge-card p-6 space-y-3 border-rose-200 bg-gradient-to-b from-rose-50/40 to-white">
            <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
              <Heart className="w-4 h-4 fill-rose-600 text-rose-600" />
              <span>Needs &amp; Goals</span>
            </div>
            <p className="text-sm font-serif font-bold text-slate-900 leading-snug">
              &quot;{participant.relationshipGoals}&quot;
            </p>
            {participant.dealbreakers && participant.dealbreakers.length > 0 && (
              <div className="pt-2 border-t border-rose-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block mb-1">
                  Non-Negotiable Boundaries:
                </span>
                <ul className="text-xs text-slate-600 space-y-1">
                  {participant.dealbreakers.map((db, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{db}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Card 2: Hobbies */}
          <div className="hinge-card p-6 space-y-3 border-amber-200 bg-gradient-to-b from-amber-50/40 to-white">
            <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
              <Smile className="w-4 h-4 text-amber-600" />
              <span>Hobbies &amp; Rituals</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(participant.hobbies || []).map((hobby, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-white border border-amber-200 text-xs font-semibold text-slate-800 shadow-2xs"
                >
                  {hobby}
                </span>
              ))}
            </div>
            <div className="pt-2 border-t border-amber-100 text-xs text-slate-600 leading-relaxed">
              Downtime pace: <strong className="capitalize text-slate-900">{participant.communicationPreferences?.pace}</strong> · Humor style: <strong className="capitalize text-slate-900">{participant.communicationPreferences?.humor}</strong>
            </div>
          </div>

          {/* Card 3: Interests */}
          <div className="hinge-card p-6 space-y-3 border-purple-200 bg-gradient-to-b from-purple-50/40 to-white">
            <div className="flex items-center space-x-2 text-purple-700 font-bold text-xs uppercase tracking-wider">
              <Compass className="w-4 h-4 text-purple-600" />
              <span>Interests &amp; Passions</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(participant.interests || []).map((interest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-white border border-purple-200 text-xs font-semibold text-slate-800 shadow-2xs"
                >
                  {interest}
                </span>
              ))}
            </div>
            <div className="pt-2 border-t border-purple-100 text-xs text-slate-600 leading-relaxed">
              Conversation style: <strong className="capitalize text-slate-900">{participant.communicationPreferences?.style}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* EVIDENCE AUDIT TRAIL: Sourced from LinkedIn & Instagram */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
            Audit Trail
          </span>
          <h2 className="font-serif text-2xl font-bold text-slate-900 mt-1">
            How The Agent Analyzed This Person
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Data obtained strictly from the person&apos;s LinkedIn and public Instagram. Every claim is verified with a confidence level.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Instagram Source Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-pink-50/50 to-white border border-pink-200/80 space-y-3">
            <div className="flex items-center space-x-2 text-pink-700 font-bold text-xs uppercase tracking-wider">
              <Instagram className="w-4 h-4" />
              <span>Sourced from Instagram ({instagramEvidence.length} claims)</span>
            </div>
            {instagramEvidence.length > 0 ? (
              <div className="space-y-2">
                {instagramEvidence.map((ev) => (
                  <div key={ev.id} className="text-xs p-3 rounded-xl bg-white border border-pink-100 space-y-1">
                    <div className="font-semibold text-slate-900">{ev.claim}</div>
                    {ev.snippet && <div className="text-slate-500 italic text-[11px]">&quot;{ev.snippet}&quot;</div>}
                    <div className="text-[10px] text-pink-600 font-bold">Confidence: {Math.round(ev.confidence * 100)}%</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">Visual and cultural pursuits mapped to public feed posts.</div>
            )}
          </div>

          {/* LinkedIn Source Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-blue-50/50 to-white border border-blue-200/80 space-y-3">
            <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
              <Linkedin className="w-4 h-4" />
              <span>Sourced from LinkedIn ({linkedinEvidence.length} claims)</span>
            </div>
            {linkedinEvidence.length > 0 ? (
              <div className="space-y-2">
                {linkedinEvidence.map((ev) => (
                  <div key={ev.id} className="text-xs p-3 rounded-xl bg-white border border-blue-100 space-y-1">
                    <div className="font-semibold text-slate-900">{ev.claim}</div>
                    {ev.snippet && <div className="text-slate-500 italic text-[11px]">&quot;{ev.snippet}&quot;</div>}
                    <div className="text-[10px] text-blue-600 font-bold">Confidence: {Math.round(ev.confidence * 100)}%</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">Professional background and public career verified.</div>
            )}
          </div>
        </div>
      </div>

      {/* Date Simulation Action Card */}
      <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 rounded-3xl p-8 text-white shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-100">
              Agent Dating Harness
            </span>
            <h2 className="font-serif text-2xl font-bold mt-1">
              Send {participant.displayName}&apos;s Agent on a Simulated Date
            </h2>
            <p className="text-xs text-rose-100 mt-1">
              Watch this agent date another person&apos;s agent in real time, exploring mutual needs, hobbies, and interests.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <select
              value={simulatingWith}
              onChange={(e) => setSimulatingWith(e.target.value)}
              className="px-3 py-2.5 rounded-2xl border border-white/30 text-xs font-semibold text-slate-900 bg-white shadow-md focus:outline-none"
            >
              <option value="">Choose candidate to date...</option>
              {allParticipants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.displayName})
                </option>
              ))}
            </select>

            <button
              onClick={handleSimulateDate}
              disabled={!simulatingWith || isSimulating}
              className="px-5 py-2.5 rounded-2xl bg-white text-rose-600 hover:bg-rose-50 font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Heart className="w-4 h-4 fill-rose-600" />
              <span>{isSimulating ? 'Dating...' : 'Date Now'}</span>
            </button>
          </div>
        </div>

        {/* Persona Prompt toggle */}
        <div className="pt-4 border-t border-white/20">
          <button
            onClick={() => setPersonaOpen(!personaOpen)}
            className="text-xs font-semibold text-white/90 hover:text-white flex items-center space-x-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{personaOpen ? 'Hide Agent Persona Prompt' : 'View Generated Agent Persona Prompt'}</span>
          </button>

          {personaOpen && (
            <pre className="mt-3 p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border border-white/10">
              {personaPrompt}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
