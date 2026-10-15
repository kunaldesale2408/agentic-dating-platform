import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { computeRankingsForParticipant } from '@/lib/compatibility';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get('targetId');

    if (targetId) {
      const target = db.getParticipant(targetId);
      if (!target) {
        return NextResponse.json({ success: false, error: 'Target participant not found' }, { status: 404 });
      }

      let rankings = db.getRankingsFor(targetId);

      // If rankings haven't been computed yet, compute them on-the-fly and save
      if (!rankings || rankings.length === 0) {
        const allParticipants = db.getParticipants();
        rankings = computeRankingsForParticipant(target, allParticipants, (candId) =>
          db.getDateBetween(target.id, candId)
        );
        db.saveRankings(targetId, rankings);
      }

      return NextResponse.json({
        success: true,
        target,
        rankings,
      });
    }

    const all = db.getAllRankings();
    return NextResponse.json({ success: true, data: all });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
