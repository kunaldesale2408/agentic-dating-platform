import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const participants = db.getParticipants();
    const dates = db.getDates();
    const rankings = db.getAllRankings();

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      description: 'Agentic Dating Research Experiment Dataset (Anonymized & Synthetic Protected)',
      metrics: {
        totalParticipants: participants.length,
        totalSimulatedDates: dates.length,
        totalRankings: Object.values(rankings).reduce((sum, r) => sum + r.length, 0),
      },
      participants,
      dates,
      rankings,
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="agentic_dating_experiment_dataset.json"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
