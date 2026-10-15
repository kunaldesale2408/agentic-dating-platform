import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SYNTHETIC_PARTICIPANTS } from '@/lib/seed-data';
import { simulateDeterministicDate } from '@/lib/agent-simulator';
import { computeRankingsForParticipant } from '@/lib/compatibility';
import { Participant, SimulatedDate, DirectedRanking } from '@/lib/types';

export async function POST() {
  try {
    const participantsMap: Record<string, Participant> = {};
    for (const p of SYNTHETIC_PARTICIPANTS) {
      participantsMap[p.id] = p;
    }

    const simulatedDatesMap: Record<string, SimulatedDate> = {};
    for (let i = 0; i < SYNTHETIC_PARTICIPANTS.length; i++) {
      for (let j = i + 1; j < SYNTHETIC_PARTICIPANTS.length; j++) {
        const date = simulateDeterministicDate(SYNTHETIC_PARTICIPANTS[i], SYNTHETIC_PARTICIPANTS[j]);
        simulatedDatesMap[date.id] = date;
      }
    }

    const rankingsMap: Record<string, DirectedRanking[]> = {};
    for (const target of SYNTHETIC_PARTICIPANTS) {
      rankingsMap[target.id] = computeRankingsForParticipant(target, SYNTHETIC_PARTICIPANTS, (candId) => {
        const sorted = [target.id, candId].sort();
        return simulatedDatesMap[`pair_${sorted[0]}_${sorted[1]}`] || null;
      });
    }

    db.replaceAll({
      participants: participantsMap,
      simulatedDates: simulatedDatesMap,
      rankings: rankingsMap,
      settings: db.getSettings(),
      progress: {
        totalPairs: 300,
        completedPairs: 300,
        failedPairs: 0,
        status: 'completed',
        finishedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Demo dataset reset to 25 synthetic participants, 300 simulated dates, and 600 rankings.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
