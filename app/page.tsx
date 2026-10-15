import Link from 'next/link';
import { db } from '@/lib/db';
import {
  HeartHandshake,
  Users,
  MessagesSquare,
  Trophy,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Sliders,
  Scale,
  BrainCircuit,
  Lock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const participants = db.getParticipants();
  const dates = db.getDates();
  const allRankings = db.getAllRankings();
  const totalRankingsCount = Object.values(allRankings).reduce((acc, list) => acc + list.length, 0);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-rose-50/70 via-white to-amber-50/40 border border-rose-100/80 p-8 sm:p-12 lg:p-16 shadow-sm">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>Ethical Agentic Dating Lab</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.15]">
            Where Autonomous Agents Date Before Humans Do.
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
            Traditional dating applications rely on superficial swipes and algorithmic opacity. 
            <strong className="text-slate-900 font-semibold"> CupidAgent</strong> assigns each consenting participant an autonomous AI agent to conduct respectful, multi-turn simulated dates—evaluating shared values, conversational rhythm, and non-negotiable dealbreakers with total mathematical transparency.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 items-center">
            <Link
              href="/demo"
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-base shadow-sm shadow-rose-600/30 transition-all hover:scale-[1.02]"
            >
              <span>Explore 25-Person Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/participants"
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-medium text-base border border-slate-200 shadow-sm transition-all"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Browse Participants</span>
            </Link>
          </div>
        </div>

        {/* Floating Stat Pill on Hero */}
        <div className="mt-10 pt-8 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <div className="text-3xl font-serif font-bold text-slate-900">{participants.length}</div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mt-0.5">Participants</div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-rose-600">{dates.length}</div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mt-0.5">Simulated Dates</div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-amber-600">{totalRankingsCount}</div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mt-0.5">Directed Rankings</div>
          </div>
          <div>
            <div className="text-3xl font-serif font-bold text-emerald-600">100%</div>
            <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mt-0.5">Consented & Auditable</div>
          </div>
        </div>
      </section>

      {/* Ethical Research Safeguards */}
      <section className="space-y-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
            Principled AI & Ethical Experimentation
          </h2>
          <p className="text-slate-600 text-sm">
            We adhere strictly to non-negotiable boundaries ensuring dignity, consent, and scientific rigor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-slate-900">Explicit Consent & Verifiable Sources</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every participant explicitly grants informed consent. Data is sourced through authorized public links or manual questionnaire submission. Never fabricated, scraped without authorization, or harvested behind logins.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-slate-900">Zero Sensitive Inference</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              We never infer sexual orientation, romantic intent, or sensitive personal attributes from photos or unrelated posts. Relationship goals and dealbreakers must be explicitly articulated by the participant.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-slate-900">Absolute Dealbreaker Enforcement</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Non-negotiable dealbreakers trigger a decisive constraint override, resetting the compatibility score to 0 and transparently explaining the incompatibility reason without ambiguity.
            </p>
          </div>
        </div>
      </section>

      {/* Methodology Roadmap */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Four-Stage Pipeline</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            How CupidAgent Evaluates Compatibility
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-3 border-l-2 border-rose-300 pl-4">
            <div className="text-xs font-bold text-rose-600">STAGE 1</div>
            <h4 className="font-semibold text-slate-900 text-sm">Participant Intake & Evidence Extraction</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Validates public URLs, checks consent, and stores verified evidence items with source attribution and confidence indicators.
            </p>
          </div>

          <div className="space-y-3 border-l-2 border-amber-300 pl-4">
            <div className="text-xs font-bold text-amber-600">STAGE 2</div>
            <h4 className="font-semibold text-slate-900 text-sm">Autonomous Agent Modeling</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Constructs a distinct persona with structured boundaries, communication style, humor, and verified background context.
            </p>
          </div>

          <div className="space-y-3 border-l-2 border-emerald-300 pl-4">
            <div className="text-xs font-bold text-emerald-600">STAGE 3</div>
            <h4 className="font-semibold text-slate-900 text-sm">Multi-turn Date Simulation</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pairs agents in 6-turn date conversations exploring shared interests, inquiring about values, and discovering points of friction.
            </p>
          </div>

          <div className="space-y-3 border-l-2 border-indigo-300 pl-4">
            <div className="text-xs font-bold text-indigo-600">STAGE 4</div>
            <h4 className="font-semibold text-slate-900 text-sm">Directed Personalized Rankings</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Computes 0-100 scores across shared interests (35%), goals (25%), date dialogue (20%), and lifestyle (20%), with dealbreaker checks.
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap gap-4 items-center justify-between border-t border-slate-100 text-sm">
          <span className="text-slate-500">
            Want to see the system in action right now?
          </span>
          <div className="flex gap-3">
            <Link href="/dates" className="text-rose-600 hover:text-rose-700 font-medium inline-flex items-center space-x-1">
              <span>Inspect Date Transcripts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/rankings" className="text-rose-600 hover:text-rose-700 font-medium inline-flex items-center space-x-1">
              <span>View Personalized Rankings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
