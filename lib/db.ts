import fs from 'fs';
import path from 'path';
import { Participant, SimulatedDate, DirectedRanking, AppSettings, SimulationJobProgress } from './types';

export interface DatabaseState {
  participants: Record<string, Participant>;
  simulatedDates: Record<string, SimulatedDate>;
  rankings: Record<string, DirectedRanking[]>;
  settings: AppSettings;
  progress: SimulationJobProgress;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_SETTINGS: AppSettings = {
  simulationMode: (process.env.SIMULATION_MODE as 'deterministic' | 'gemini') || 'deterministic',
  geminiApiKeyConfigured: !!process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || '5', 10),
  deterministicDelayMs: 20,
  dataMinimizationEnabled: true,
};

const DEFAULT_PROGRESS: SimulationJobProgress = {
  totalPairs: 300,
  completedPairs: 0,
  failedPairs: 0,
  status: 'idle',
};

class StorageEngine {
  private cache: DatabaseState | null = null;
  private isWriting = false;
  private pendingWrite: DatabaseState | null = null;

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  public getPairKey(idA: string, idB: string): string {
    const sorted = [idA, idB].sort();
    return `pair_${sorted[0]}_${sorted[1]}`;
  }

  private loadSync(): DatabaseState {
    if (this.cache) return this.cache;
    this.ensureDir();

    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseState = {
        participants: {},
        simulatedDates: {},
        rankings: {},
        settings: DEFAULT_SETTINGS,
        progress: DEFAULT_PROGRESS,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      this.cache = initial;
      return initial;
    }

    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      this.cache = {
        participants: parsed.participants || {},
        simulatedDates: parsed.simulatedDates || {},
        rankings: parsed.rankings || {},
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        progress: { ...DEFAULT_PROGRESS, ...(parsed.progress || {}) },
      };
      return this.cache;
    } catch (err) {
      console.error('[DB] Failed reading DB file, creating fresh initial state', err);
      const initial: DatabaseState = {
        participants: {},
        simulatedDates: {},
        rankings: {},
        settings: DEFAULT_SETTINGS,
        progress: DEFAULT_PROGRESS,
      };
      this.cache = initial;
      return initial;
    }
  }

  private persist() {
    if (!this.cache) return;
    this.ensureDir();

    const dataToSave = JSON.stringify(this.cache, null, 2);
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;

    try {
      fs.writeFileSync(tempFile, dataToSave, 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('[DB] Atomic write failed, attempting direct write:', err);
      try {
        fs.writeFileSync(DB_FILE, dataToSave, 'utf-8');
      } catch (err2) {
        console.error('[DB] Direct write also failed:', err2);
      }
    }
  }

  // Participants
  public getParticipants(): Participant[] {
    const state = this.loadSync();
    return Object.values(state.participants).sort((a, b) => a.name.localeCompare(b.name));
  }

  public getParticipant(id: string): Participant | null {
    const state = this.loadSync();
    return state.participants[id] || null;
  }

  public saveParticipant(participant: Participant): Participant {
    const state = this.loadSync();
    state.participants[participant.id] = participant;
    this.persist();
    return participant;
  }

  public deleteParticipant(id: string): boolean {
    const state = this.loadSync();
    if (!state.participants[id]) return false;

    delete state.participants[id];

    // Remove dates involving this participant
    for (const [key, date] of Object.entries(state.simulatedDates)) {
      if (date.participantAId === id || date.participantBId === id) {
        delete state.simulatedDates[key];
      }
    }

    // Remove rankings for and mentioning this participant
    delete state.rankings[id];
    for (const [targetId, rList] of Object.entries(state.rankings)) {
      state.rankings[targetId] = rList.filter((r) => r.candidateParticipantId !== id);
    }

    this.persist();
    return true;
  }

  // Simulated Dates
  public getDates(): SimulatedDate[] {
    const state = this.loadSync();
    return Object.values(state.simulatedDates);
  }

  public getDate(id: string): SimulatedDate | null {
    const state = this.loadSync();
    return state.simulatedDates[id] || null;
  }

  public getDateBetween(idA: string, idB: string): SimulatedDate | null {
    const key = this.getPairKey(idA, idB);
    const state = this.loadSync();
    return state.simulatedDates[key] || null;
  }

  public saveDate(date: SimulatedDate): SimulatedDate {
    const key = this.getPairKey(date.participantAId, date.participantBId);
    const state = this.loadSync();
    state.simulatedDates[key] = { ...date, id: key };
    this.persist();
    return state.simulatedDates[key];
  }

  // Rankings
  public getRankingsFor(targetId: string): DirectedRanking[] {
    const state = this.loadSync();
    return state.rankings[targetId] || [];
  }

  public getAllRankings(): Record<string, DirectedRanking[]> {
    const state = this.loadSync();
    return state.rankings;
  }

  public saveRankings(targetId: string, rankings: DirectedRanking[]) {
    const state = this.loadSync();
    state.rankings[targetId] = rankings;
    this.persist();
  }

  // Settings
  public getSettings(): AppSettings {
    const state = this.loadSync();
    return {
      ...state.settings,
      geminiApiKeyConfigured: !!(process.env.GEMINI_API_KEY || (typeof global !== 'undefined' && (global as any).__OVERRIDE_GEMINI_KEY)),
    };
  }

  public updateSettings(partial: Partial<AppSettings>): AppSettings {
    const state = this.loadSync();
    state.settings = { ...state.settings, ...partial };
    this.persist();
    return state.settings;
  }

  // Progress
  public getProgress(): SimulationJobProgress {
    const state = this.loadSync();
    return state.progress;
  }

  public updateProgress(progress: Partial<SimulationJobProgress>): SimulationJobProgress {
    const state = this.loadSync();
    state.progress = { ...state.progress, ...progress };
    this.persist();
    return state.progress;
  }

  // Raw reset & purge
  public replaceAll(newState: DatabaseState) {
    this.cache = newState;
    this.persist();
  }

  public purgeNonSynthetic() {
    const state = this.loadSync();
    for (const [id, p] of Object.entries(state.participants)) {
      if (!p.isSynthetic) {
        this.deleteParticipant(id);
      }
    }
  }
}

export const db = new StorageEngine();
