import fs from 'fs';
import path from 'path';
import { SYNTHETIC_PARTICIPANTS } from '../lib/seed-data';
import { simulateDeterministicDate } from '../lib/agent-simulator';
import { computeRankingsForParticipant } from '../lib/compatibility';
import { Participant, SimulatedDate, DirectedRanking, AppSettings, SimulationJobProgress } from '../lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

async function runSeed() {
  console.log('🌱 Starting Agentic Dating Platform Data Seeding...');
  ensureDir();

  const participantsMap: Record<string, Participant> = {};
  for (const p of SYNTHETIC_PARTICIPANTS) {
    participantsMap[p.id] = p;
  }
  console.log(`✅ Loaded ${SYNTHETIC_PARTICIPANTS.length} synthetic fictional participants.`);

  // Generate all 300 pairs (25 * 24 / 2)
  const simulatedDatesMap: Record<string, SimulatedDate> = {};
  const pairs: [Participant, Participant][] = [];

  for (let i = 0; i < SYNTHETIC_PARTICIPANTS.length; i++) {
    for (let j = i + 1; j < SYNTHETIC_PARTICIPANTS.length; j++) {
      pairs.push([SYNTHETIC_PARTICIPANTS[i], SYNTHETIC_PARTICIPANTS[j]]);
    }
  }

  console.log(`🔄 Simulating multi-turn agent dates for all ${pairs.length} unique pairs...`);
  let dealbreakerCount = 0;

  for (const [pA, pB] of pairs) {
    const date = simulateDeterministicDate(pA, pB);
    simulatedDatesMap[date.id] = date;
    if (date.structuredReport.dealbreakerDetected) {
      dealbreakerCount++;
    }
  }

  console.log(`✅ Simulated ${Object.keys(simulatedDatesMap).length} dates (${dealbreakerCount} dealbreakers detected).`);

  // Compute directed rankings for each participant (25 * 24 = 600 directed rankings)
  console.log('📊 Computing 600 directed compatibility rankings across all participants...');
  const rankingsMap: Record<string, DirectedRanking[]> = {};

  for (const target of SYNTHETIC_PARTICIPANTS) {
    const rankings = computeRankingsForParticipant(target, SYNTHETIC_PARTICIPANTS, (candId) => {
      const sorted = [target.id, candId].sort();
      return simulatedDatesMap[`pair_${sorted[0]}_${sorted[1]}`] || null;
    });
    rankingsMap[target.id] = rankings;
  }

  const totalDirectedRankings = Object.values(rankingsMap).reduce((sum, r) => sum + r.length, 0);
  console.log(`✅ Generated ${totalDirectedRankings} directed rankings.`);

  const settings: AppSettings = {
    simulationMode: 'deterministic',
    geminiApiKeyConfigured: !!process.env.GEMINI_API_KEY,
    geminiModel: 'gemini-1.5-flash',
    maxConcurrency: 5,
    deterministicDelayMs: 20,
    dataMinimizationEnabled: true,
  };

  const progress: SimulationJobProgress = {
    totalPairs: pairs.length,
    completedPairs: pairs.length,
    failedPairs: 0,
    status: 'completed',
    finishedAt: new Date().toISOString(),
  };

  const state = {
    participants: participantsMap,
    simulatedDates: simulatedDatesMap,
    rankings: rankingsMap,
    settings,
    progress,
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  console.log(`💾 Saved state to ${DB_FILE}`);
  console.log('🎉 Seeding successfully finished! Demo route is fully preloaded.');
}

runSeed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
