'use client';

import { useState, useEffect } from 'react';
import { AppSettings } from '@/lib/types';
import {
  Settings,
  ShieldCheck,
  Download,
  Trash2,
  RotateCcw,
  Sparkles,
  Calculator,
  Lock,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Key,
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [simulationMode, setSimulationMode] = useState<'deterministic' | 'gemini'>('deterministic');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash');
  const [maxConcurrency, setMaxConcurrency] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setSimulationMode(data.data.simulationMode);
        setGeminiModel(data.data.geminiModel || 'gemini-1.5-flash');
        setMaxConcurrency(data.data.maxConcurrency || 5);
      }
    } catch (err) {
      console.error('Error fetching settings', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload: any = {
        simulationMode,
        geminiModel,
        maxConcurrency,
      };

      if (geminiApiKey) {
        payload.geminiApiKey = geminiApiKey;
      }

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handlePurgeCustom() {
    if (!confirm('Purge all non-synthetic participant data? This deletes all manually added test participants, leaving synthetic demo data intact.')) {
      return;
    }
    try {
      const pRes = await fetch('/api/participants');
      const pData = await pRes.json();
      if (pData.success) {
        const custom = pData.data.filter((p: any) => !p.isSynthetic);
        for (const p of custom) {
          await fetch(`/api/participants/${p.id}`, { method: 'DELETE' });
        }
        alert(`Purged ${custom.length} custom participant(s).`);
      }
    } catch (err) {
      alert('Error during purge');
    }
  }

  // Cost calculation
  const estimatedInputTokensPerDate = 850;
  const estimatedOutputTokensPerDate = 450;
  const totalPairs = 300;
  const isFlash = geminiModel.includes('flash');
  const inputRate = isFlash ? 0.075 / 1000000 : 3.5 / 1000000;
  const outputRate = isFlash ? 0.30 / 1000000 : 10.5 / 1000000;

  const costPerDate = simulationMode === 'deterministic'
    ? 0
    : estimatedInputTokensPerDate * inputRate + estimatedOutputTokensPerDate * outputRate;

  const costTotalBatch = costPerDate * totalPairs;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight">
          System Settings &amp; Privacy Controls
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Configure model simulation providers, estimate API expenditure, manage concurrency limits, and exercise data minimization rights.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="font-semibold">Settings successfully updated and persisted!</span>
        </div>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
            Agent Engine Configuration
          </span>
          <h2 className="font-serif text-2xl font-bold text-slate-900 mt-1">
            Model Simulation Provider
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Toggle between deterministic local simulation (instant, free, reproducible) or Google Gemini LLM API.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label
            onClick={() => setSimulationMode('deterministic')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              simulationMode === 'deterministic'
                ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="simMode"
                checked={simulationMode === 'deterministic'}
                onChange={() => setSimulationMode('deterministic')}
                className="text-rose-600"
              />
              <span className="font-bold text-sm text-slate-900">Deterministic Local Simulator</span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Zero API cost, deterministic, instant response. Generates high-quality 6-turn date transcripts and structured reports using rule-based reasoning.
            </p>
          </label>

          <label
            onClick={() => setSimulationMode('gemini')}
            className={`p-5 rounded-2xl border cursor-pointer transition-all ${
              simulationMode === 'gemini'
                ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                name="simMode"
                checked={simulationMode === 'gemini'}
                onChange={() => setSimulationMode('gemini')}
                className="text-rose-600"
              />
              <span className="font-bold text-sm text-slate-900">Google Gemini LLM</span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Direct server-side LLM calls behind an adapter. Safely falls back to deterministic if the API key is missing or quota is exhausted.
            </p>
          </label>
        </div>

        {/* Gemini Settings Box */}
        {simulationMode === 'gemini' && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Key className="w-4 h-4 text-rose-600" />
              <span>Gemini API Credentials (Server-Side Only)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gemini API Key
              </label>
              <input
                type="password"
                placeholder={settings?.geminiApiKeyConfigured ? '•••••••••••••••• (Configured)' : 'Enter GEMINI_API_KEY'}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Never exposed to client bundles or browser network tabs. Kept behind server-side adapter.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Model Name
              </label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
              >
                <option value="gemini-1.5-flash">gemini-1.5-flash (Recommended: fast, high quality, lowest cost)</option>
                <option value="gemini-1.5-pro">gemini-1.5-pro (Deep reasoning)</option>
              </select>
            </div>
          </div>
        )}

        {/* Max Concurrency Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-700">
              Maximum Worker Concurrency: {maxConcurrency}
            </span>
            <span className="text-slate-500">1 to 20 parallel workers</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={maxConcurrency}
            onChange={(e) => setMaxConcurrency(parseInt(e.target.value, 10))}
            className="w-full accent-rose-600"
          />
          <span className="text-[11px] text-slate-500 block">
            Controls queue batch parallelism to prevent uncontrolled request floods or API rate limit errors.
          </span>
        </div>

        {/* Cost Estimator Box */}
        <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-900">
            <Calculator className="w-4 h-4 text-amber-600" />
            <span>Model Cost Estimation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-3 rounded-xl border border-amber-200">
              <span className="text-slate-500 block">Tokens per Date</span>
              <span className="font-bold text-slate-900 text-sm">~1,300 tokens</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200">
              <span className="text-slate-500 block">Cost per Date</span>
              <span className="font-bold text-slate-900 text-sm">
                {simulationMode === 'deterministic' ? '$0.00' : `$${costPerDate.toFixed(4)}`}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200">
              <span className="text-slate-500 block">All 300 Pairs Total</span>
              <span className="font-bold text-rose-700 text-sm">
                {simulationMode === 'deterministic' ? '$0.00 (Free)' : `~$${costTotalBatch.toFixed(2)} USD`}
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </form>

      {/* Privacy and Data Minimization */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
            Privacy &amp; Data Rights
          </span>
          <h2 className="font-serif text-2xl font-bold text-slate-900 mt-1">
            Data Minimization &amp; Export Controls
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Participants retain sovereign ownership over their profile data, with immediate export and deletion capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <Download className="w-4 h-4 text-slate-600" />
                <span>Export Dataset (JSON)</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Download a clean, structured JSON file containing all participants, simulated date transcripts, and calculated rankings.
              </p>
            </div>

            <a
              href="/api/export"
              download
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON Export</span>
            </a>
          </div>

          <div className="p-5 rounded-2xl border border-red-200 bg-red-50/20 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-red-900 font-bold text-sm">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Purge Custom Added Participants</span>
              </div>
              <p className="text-xs text-red-800 mt-1">
                Permanently deletes any user-submitted test participants, associated dates, and rankings, keeping synthetic demo profiles intact.
              </p>
            </div>

            <button
              onClick={handlePurgeCustom}
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Test Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
