import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settingsUpdateSchema } from '@/lib/schemas';

export async function GET() {
  try {
    const settings = db.getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = settingsUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid settings payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { geminiApiKey, ...otherSettings } = parsed.data;

    // Handle runtime API key safely without exposing in client bundles
    if (geminiApiKey !== undefined) {
      if (geminiApiKey.trim()) {
        (global as any).__OVERRIDE_GEMINI_KEY = geminiApiKey.trim();
      } else {
        delete (global as any).__OVERRIDE_GEMINI_KEY;
      }
    }

    const updated = db.updateSettings(otherSettings);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
