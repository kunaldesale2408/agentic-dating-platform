import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { participantInputSchema } from '@/lib/schemas';
import { Participant, EvidenceItem } from '@/lib/types';
import { computeRankingsForParticipant } from '@/lib/compatibility';
import { simulateDeterministicDate } from '@/lib/agent-simulator';

export async function GET(req: NextRequest) {
  try {
    const participants = db.getParticipants();
    return NextResponse.json({ success: true, data: participants });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = participantInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const evidence: EvidenceItem[] = [
      {
        id: `ev_${Date.now()}_1`,
        claim: 'Verified consent to participate in AI agent dating experiment',
        source: 'participant_provided',
        confidence: 1.0,
        snippet: 'Explicit user consent checkbox confirmed at onboarding',
        extractedAt: now,
      },
      {
        id: `ev_${Date.now()}_2`,
        claim: `Public LinkedIn Profile: ${data.linkedinUrl}`,
        source: 'linkedin',
        confidence: 0.95,
        snippet: 'Authorized public profile URL submitted by participant',
        extractedAt: now,
      },
      {
        id: `ev_${Date.now()}_3`,
        claim: `Public Instagram Handle: ${data.instagramUrl}`,
        source: 'instagram',
        confidence: 0.9,
        snippet: 'Authorized public profile URL submitted by participant',
        extractedAt: now,
      },
    ];

    if (data.rawExtractedText) {
      evidence.push({
        id: `ev_${Date.now()}_4`,
        claim: 'Self-reported profile and hobby summary',
        source: 'participant_provided',
        confidence: 0.98,
        snippet: data.rawExtractedText.slice(0, 150),
        extractedAt: now,
      });
    }

    const newParticipant: Participant = {
      id,
      name: data.name,
      displayName: data.displayName,
      linkedinUrl: data.linkedinUrl,
      instagramUrl: data.instagramUrl,
      consentGiven: true,
      consentTimestamp: now,
      extractionStatus: data.extractionMode === 'manual' ? 'manual' : 'extracted',
      bio: data.bio || `Participant in ethical dating research experiment.`,
      interests: data.interests.length > 0 ? data.interests : ['Conversation', 'Coffee', 'Creative Exploration'],
      hobbies: data.hobbies.length > 0 ? data.hobbies : ['Walking', 'Reading'],
      communicationPreferences: data.communicationPreferences,
      relationshipGoals: data.relationshipGoals,
      dealbreakers: data.dealbreakers,
      evidence,
      unknowns: ['In-person conversational rhythm', 'Long-term city vs suburban preference'],
      isSynthetic: false,
      createdAt: now,
      updatedAt: now,
    };

    db.saveParticipant(newParticipant);

    // Run simulated dates with existing participants so the new participant has instant matches
    const allParticipants = db.getParticipants();
    for (const other of allParticipants) {
      if (other.id !== newParticipant.id) {
        const date = simulateDeterministicDate(newParticipant, other);
        db.saveDate(date);
      }
    }

    // Recompute rankings for this new participant
    const rankings = computeRankingsForParticipant(newParticipant, allParticipants, (candId) => {
      return db.getDateBetween(newParticipant.id, candId);
    });
    db.saveRankings(newParticipant.id, rankings);

    return NextResponse.json({ success: true, data: newParticipant }, { status: 201 });
  } catch (err: any) {
    console.error('[API participants POST]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
