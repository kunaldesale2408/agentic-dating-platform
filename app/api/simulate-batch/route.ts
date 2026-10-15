import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { batchSimulationRequestSchema } from '@/lib/schemas';
import { runBatchSimulation, cancelActiveJob, isJobRunning } from '@/lib/queue';

export async function GET() {
  try {
    const progress = db.getProgress();
    return NextResponse.json({
      success: true,
      data: {
        ...progress,
        isRunning: isJobRunning(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (isJobRunning()) {
      return NextResponse.json(
        { success: false, error: 'A simulation batch is already running', data: db.getProgress() },
        { status: 409 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = batchSimulationRequestSchema.safeParse(body);

    const options = parsed.success
      ? parsed.data
      : { concurrency: 5, mode: 'deterministic' as const };

    // Start background simulation job
    // We launch it asynchronously and respond with the initial job progress
    runBatchSimulation({
      concurrency: options.concurrency,
      mode: options.mode,
      forceRerun: true,
    }).catch((err) => {
      console.error('[Batch simulation job error]', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Batch simulation job initiated',
      data: db.getProgress(),
    });
  } catch (err: any) {
    console.error('[API simulate-batch POST]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    cancelActiveJob();
    return NextResponse.json({
      success: true,
      message: 'Cancellation requested for active simulation batch',
      data: db.getProgress(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
