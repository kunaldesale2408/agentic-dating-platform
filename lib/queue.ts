import { db } from './db';
import { runSimulatedDate } from './agent-simulator';
import { computeRankingsForParticipant } from './compatibility';
import { Participant, SimulationJobProgress } from './types';

export interface BatchSimulationOptions {
  concurrency?: number;
  mode?: 'deterministic' | 'gemini';
  delayMs?: number;
  forceRerun?: boolean;
}

let activeJobRunning = false;
let shouldCancelCurrentJob = false;

export function isJobRunning(): boolean {
  return activeJobRunning;
}

export function cancelActiveJob(): void {
  shouldCancelCurrentJob = true;
}

/**
 * Generates all unique unordered pairs (A, B) where A.id < B.id
 */
export function generatePairs(participants: Participant[]): [Participant, Participant][] {
  const pairs: [Participant, Participant][] = [];
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      pairs.push([participants[i], participants[j]]);
    }
  }
  return pairs;
}

/**
 * Recomputes all directed rankings for all participants based on stored dates
 */
export function recomputeAllRankings(): void {
  const participants = db.getParticipants();
  for (const p of participants) {
    const rankings = computeRankingsForParticipant(p, participants, (candidateId) => {
      return db.getDateBetween(p.id, candidateId);
    });
    db.saveRankings(p.id, rankings);
  }
}

/**
 * Runs batch simulation across pairs with bounded concurrency and progress reporting
 */
export async function runBatchSimulation(options: BatchSimulationOptions = {}): Promise<SimulationJobProgress> {
  if (activeJobRunning) {
    return db.getProgress();
  }

  activeJobRunning = true;
  shouldCancelCurrentJob = false;

  const participants = db.getParticipants();
  const allPairs = generatePairs(participants);
  const totalPairs = allPairs.length;

  const concurrency = options.concurrency || db.getSettings().maxConcurrency || 5;
  const mode = options.mode || db.getSettings().simulationMode || 'deterministic';
  const delayMs = options.delayMs !== undefined ? options.delayMs : (mode === 'deterministic' ? 10 : 200);

  // Filter pairs if not forcing rerun
  const pairsToProcess = options.forceRerun
    ? allPairs
    : allPairs.filter(([a, b]) => !db.getDateBetween(a.id, b.id));

  let completed = totalPairs - pairsToProcess.length;
  let failed = 0;

  db.updateProgress({
    totalPairs,
    completedPairs: completed,
    failedPairs: failed,
    status: 'running',
    startedAt: new Date().toISOString(),
  });

  const queue = [...pairsToProcess];

  async function worker() {
    while (queue.length > 0 && !shouldCancelCurrentJob) {
      const pair = queue.shift();
      if (!pair) break;

      const [pA, pB] = pair;
      const pairDesc = `${pA.displayName} & ${pB.displayName}`;

      db.updateProgress({ currentPair: pairDesc });

      let attempts = 0;
      let success = false;

      while (attempts < 2 && !success) {
        attempts++;
        try {
          const dateResult = await runSimulatedDate(pA, pB, {
            mode,
            delayMs,
          });
          db.saveDate(dateResult);
          success = true;
        } catch (err: any) {
          console.error(`[Queue] Error simulating pair ${pairDesc} (attempt ${attempts}):`, err.message);
          if (attempts >= 2) {
            failed++;
          }
        }
      }

      completed++;
      db.updateProgress({
        completedPairs: completed,
        failedPairs: failed,
      });
    }
  }

  try {
    const workers = Array.from({ length: Math.min(concurrency, queue.length || 1) }, () => worker());
    await Promise.all(workers);

    // Compute rankings once all pairs are finished
    recomputeAllRankings();

    const finalStatus = shouldCancelCurrentJob ? 'paused' : 'completed';
    const progress = db.updateProgress({
      status: finalStatus,
      finishedAt: new Date().toISOString(),
      currentPair: undefined,
    });

    return progress;
  } catch (err: any) {
    const progress = db.updateProgress({
      status: 'failed',
      errorMessage: err.message,
    });
    return progress;
  } finally {
    activeJobRunning = false;
    shouldCancelCurrentJob = false;
  }
}
