import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const participant = db.getParticipant(params.id);
    if (!participant) {
      return NextResponse.json({ success: false, error: 'Participant not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: participant });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = db.deleteParticipant(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Participant not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Participant and all associated dates deleted' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
