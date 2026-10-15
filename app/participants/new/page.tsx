'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  Plus,
  X,
} from 'lucide-react';

export default function NewParticipantPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [extractionMode, setExtractionMode] = useState<'auto' | 'manual'>('auto');
  const [bio, setBio] = useState('');
  const [interestsInput, setInterestsInput] = useState('');
  const [hobbiesInput, setHobbiesInput] = useState('');
  const [relationshipGoals, setRelationshipGoals] = useState('');
  const [dealbreakersInput, setDealbreakersInput] = useState('');
  const [commStyle, setCommStyle] = useState<'thoughtful' | 'playful' | 'direct' | 'reserved' | 'spontaneous'>('thoughtful');
  const [commPace, setCommPace] = useState<'measured' | 'fast' | 'adaptive'>('measured');
  const [commHumor, setCommHumor] = useState<'dry' | 'witty' | 'warm' | 'sarcastic' | 'gentle'>('warm');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!consentGiven) {
      setError('Informed consent is legally and ethically mandatory to participate.');
      return;
    }

    if (!relationshipGoals.trim()) {
      setError('Please explicitly define your relationship goals. Models are prohibited from guessing romantic intent.');
      return;
    }

    setLoading(true);

    const interests = interestsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const hobbies = hobbiesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const dealbreakers = dealbreakersInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      displayName: displayName.trim() || name.trim().split(' ')[0],
      linkedinUrl: linkedinUrl.trim(),
      instagramUrl: instagramUrl.trim(),
      consentGiven: true,
      extractionMode,
      bio: bio.trim(),
      interests,
      hobbies,
      communicationPreferences: {
        style: commStyle,
        pace: commPace,
        humor: commHumor,
      },
      relationshipGoals: relationshipGoals.trim(),
      dealbreakers,
    };

    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to register participant');
      }

      router.push(`/participants/${data.data.id}`);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/participants"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Directory</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-sm space-y-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
            Participant Onboarding
          </span>
          <h1 className="font-serif text-3xl font-bold text-slate-900 mt-1">
            Register Consenting Participant
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Create an autonomous AI agent to represent you in compatibility simulations. 
            All public profile data is strictly auditable, and sensitive traits are never inferred.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Submission Incomplete</div>
              <div className="text-xs mt-0.5">{error}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maya Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Agent Display Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maya"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Public LinkedIn URL *
              </label>
              <input
                type="url"
                required
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Public Instagram URL *
              </label>
              <input
                type="url"
                required
                placeholder="https://instagram.com/username"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          {/* Extraction Mode toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Data Verification Pipeline
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setExtractionMode('auto')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    extractionMode === 'auto'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  Automated Extraction
                </button>
                <button
                  type="button"
                  onClick={() => setExtractionMode('manual')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    extractionMode === 'manual'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  Manual Entry Fallback
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              When platform protections prevent automated web crawling, our system relies on authenticated participant self-disclosure to ensure 100% compliance with platform terms of service.
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Personal Bio / Self-Description
            </label>
            <textarea
              rows={3}
              placeholder="Tell us about your background, career, what lights you up, and what you do on weekends..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          {/* Interests & Hobbies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Interests & Passions (comma separated)
              </label>
              <input
                type="text"
                placeholder="Architecture, Ceramics, Bouldering, Jazz"
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Hobbies & Downtime (comma separated)
              </label>
              <input
                type="text"
                placeholder="Pottery, Film Photography, Pour-over Coffee"
                value={hobbiesInput}
                onChange={(e) => setHobbiesInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          {/* Communication Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Communication Style
              </label>
              <select
                value={commStyle}
                onChange={(e: any) => setCommStyle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
              >
                <option value="thoughtful">Thoughtful & Reflective</option>
                <option value="playful">Playful & Banter-heavy</option>
                <option value="direct">Direct & Candid</option>
                <option value="reserved">Reserved & Observant</option>
                <option value="spontaneous">Spontaneous & High-Energy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Pacing
              </label>
              <select
                value={commPace}
                onChange={(e: any) => setCommPace(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
              >
                <option value="measured">Measured & Unhurried</option>
                <option value="fast">Fast & Responsive</option>
                <option value="adaptive">Adaptive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Humor Style
              </label>
              <select
                value={commHumor}
                onChange={(e: any) => setCommHumor(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
              >
                <option value="warm">Warm & Affectionate</option>
                <option value="witty">Witty & Quick</option>
                <option value="dry">Dry & Understated</option>
                <option value="sarcastic">Sarcastic</option>
                <option value="gentle">Gentle</option>
              </select>
            </div>
          </div>

          {/* Stated Goals & Dealbreakers */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Explicit Relationship Goals * (Mandatory)
              </label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Looking for a committed life partner to build an intentional, artistic home together."
                value={relationshipGoals}
                onChange={(e) => setRelationshipGoals(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
              <span className="text-[11px] text-slate-500">
                Ethical rule: AI models will not infer romantic readiness. This must be directly stated.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Non-Negotiable Dealbreakers (comma separated)
              </label>
              <input
                type="text"
                placeholder="Active smoking, Cat allergy (lives with cats), Workaholic 80-hour schedule"
                value={dealbreakersInput}
                onChange={(e) => setDealbreakersInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
              <span className="text-[11px] text-slate-500">
                Hard constraints: A match violating any dealbreaker will be transparently penalized to a score of 0.
              </span>
            </div>
          </div>

          {/* Informed Consent Checkbox */}
          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-start space-x-3 cursor-pointer p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 hover:bg-rose-50 transition-colors">
              <input
                type="checkbox"
                required
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-rose-300"
              />
              <div className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900">
                  I give informed consent to participate in this dating research experiment.
                </span>{' '}
                I confirm that the LinkedIn and Instagram URLs provided belong to me and are public. 
                I authorize CupidAgent to represent me as an AI agent in multi-turn simulated dates. 
                I understand I can delete my data and revoke consent at any time in Settings.
              </div>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-colors shadow-sm shadow-rose-600/30 flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Configuring Agent & Running Initial Pairings...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm Consent & Create Agent</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
