import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { singleDateRequestSchema } from '@/lib/schemas';
import { runSimulatedDate } from '@/lib/agent-simulator';
import { computeRankingsForParticipant } from '@/lib/compatibility';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get('participantId');
    const dateId = searchParams.get('id');

    if (dateId) {
      const date = db.getDate(dateId);
      if (!date) {
        return NextResponse.json({ success: false, error: 'Date not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: date });
    }

    let dates = db.getDates();
    if (participantId) {
      dates = dates.filter(
        (d) => d.participantAId === participantId || d.participantBId === participantId
      );
    }

    return NextResponse.json({ success: true, count: dates.length, data: dates });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = singleDateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { participantAId, participantBId, forceRerun } = parsed.data;

    const pA = db.getParticipant(participantAId);
    const pB = db.getParticipant(participantBId);

    if (!pA || !pB) {
      return NextResponse.json(
        { success: false, error: 'One or both participants could not be found' },
        { status: 404 }
      );
    }

    // Check if date already exists
    const existing = db.getDateBetween(participantAId, participantBId);
    if (existing && !forceRerun) {
      return NextResponse.json({ success: true, data: existing, reused: true });
    }

    const settings = db.getSettings();
    const simulatedDate = await runSimulatedDate(pA, pB, {
      mode: settings.simulationMode,
      delayMs: settings.deterministicDelayMs,
    });

    db.saveDate(simulatedDate);

    // Update rankings for both participants
    const allParticipants = db.getParticipants();
    const rankingsA = computeRankingsForParticipant(pA, allParticipants, (candId) =>
      db.getDateBetween(pA.id, candId)
    );
    const rankingsB = computeRankingsForParticipant(pB, allParticipants, (candId) =>
      db.getDateBetween(pB.id, candId)
    );

    db.saveRankings(pA.id, rankingsA);
    db.saveRankings(pB.id, rankingsB);

    return NextResponse.json({ success: true, data: simulatedDate, reused: false });
  } catch (err: any) {
    console.error('[API dates POST]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
