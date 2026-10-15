import { Participant, SimulatedDate, DateTurn, StructuredDateReport } from './types';
import { evaluateDealbreakers, computeSharedInterests } from './compatibility';

export interface SimulationOptions {
  mode?: 'deterministic' | 'gemini';
  apiKey?: string;
  model?: string;
  delayMs?: number;
}

/**
 * Builds an agent persona descriptor from participant data
 */
export function buildAgentPersona(p: Participant): string {
  const interests = (p.interests || []).join(', ');
  const hobbies = (p.hobbies || []).join(', ');
  const dealbreakers = (p.dealbreakers || []).join(', ');
  const verifiedClaims = (p.evidence || [])
    .slice(0, 3)
    .map((e) => `• [${e.source}] ${e.claim}`)
    .join('\n');

  return `
AGENT PERSONA FOR: ${p.displayName} (${p.name})
- Bio: ${p.bio || 'Consenting participant in dating research experiment.'}
- Interests: ${interests || 'General arts, conversation, and technology'}
- Hobbies: ${hobbies || 'Reading, urban walks'}
- Communication Style: ${p.communicationPreferences?.style || 'thoughtful'}, Pace: ${p.communicationPreferences?.pace || 'measured'}, Humor: ${p.communicationPreferences?.humor || 'warm'}
- Stated Relationship Goals: ${p.relationshipGoals || 'Looking for an aligned partner'}
- Explicit Dealbreakers: ${dealbreakers || 'None specified'}
- Verified Evidence:
${verifiedClaims || '• Participant-supplied self-report'}
`.trim();
}

/**
 * Deterministic multi-turn conversation simulator
 */
export function simulateDeterministicDate(
  participantA: Participant,
  participantB: Participant
): SimulatedDate {
  const startedAt = new Date().toISOString();
  const interestsResult = computeSharedInterests(participantA, participantB);
  const dbCheckA = evaluateDealbreakers(participantA, participantB);
  const dbCheckB = evaluateDealbreakers(participantB, participantA);
  const dealbreakerDetected = dbCheckA.triggered || dbCheckB.triggered;
  const dealbreakerDetails = [
    ...(dbCheckA.reasons || []),
    ...(dbCheckB.reasons || []),
  ].join('; ');

  const commonTopic = interestsResult.shared[0] || participantA.interests[0] || 'creative curiosity';
  const aStyle = participantA.communicationPreferences?.style || 'thoughtful';
  const bStyle = participantB.communicationPreferences?.style || 'thoughtful';

  const transcript: DateTurn[] = [
    {
      turnIndex: 1,
      speakerId: participantA.id,
      speakerName: participantA.displayName,
      intent: 'greeting',
      message: `Hi ${participantB.displayName}! It's really wonderful to connect. I was reading over your background, and your focus on ${participantB.interests[0] || 'your creative work'} caught my eye right away. How has your week been unfolding?`,
      timestamp: new Date(Date.now() - 50000).toISOString(),
    },
    {
      turnIndex: 2,
      speakerId: participantB.id,
      speakerName: participantB.displayName,
      intent: 'inquiry',
      message: `Hey ${participantA.displayName}! Great to meet your agent here. My week has been full of focus—especially diving into ${participantB.hobbies[0] || 'personal projects'}. I noticed we both share a passion for ${commonTopic}. What originally sparked your interest in that?`,
      timestamp: new Date(Date.now() - 40000).toISOString(),
    },
    {
      turnIndex: 3,
      speakerId: participantA.id,
      speakerName: participantA.displayName,
      intent: 'sharing',
      message: `For me, ${commonTopic} was a gateway to understanding how I think and relate to people. In day-to-day life, I tend to be quite ${aStyle} in how I communicate. When you look at relationships, what kind of dynamic brings out your best energy?`,
      timestamp: new Date(Date.now() - 30000).toISOString(),
    },
    {
      turnIndex: 4,
      speakerId: participantB.id,
      speakerName: participantB.displayName,
      intent: 'boundary_check',
      message: `I deeply value intentionality. My stated relationship goal is "${participantB.relationshipGoals}". When two people communicate with mutual respect and a ${bStyle} rhythm, everyday moments become genuinely meaningful. How does that vision resonate with where you're at?`,
      timestamp: new Date(Date.now() - 20000).toISOString(),
    },
    {
      turnIndex: 5,
      speakerId: participantA.id,
      speakerName: participantA.displayName,
      intent: 'vulnerability',
      message: `That aligns well with my priority: "${participantA.relationshipGoals}". I value honest boundaries and having space for personal growth alongside shared adventures. If we ever encounter differences, I prefer addressing them with clarity and kindness.`,
      timestamp: new Date(Date.now() - 10000).toISOString(),
    },
    {
      turnIndex: 6,
      speakerId: participantB.id,
      speakerName: participantB.displayName,
      intent: 'closing',
      message: `I appreciate that grounded attitude. Exploring our perspectives on ${commonTopic} and hearing how you navigate life gives me a great sense of your character. I'd love to see this translate into thoughtful next conversations!`,
      timestamp: new Date().toISOString(),
    },
  ];

  // Base conversational engagement score derived from interest resonance and flow
  const engagementScore = Math.min(
    95,
    Math.max(50, 65 + interestsResult.shared.length * 7 - (dealbreakerDetected ? 30 : 0))
  );

  const potentialFriction: string[] = [];
  if (dealbreakerDetected) {
    potentialFriction.push(`Dealbreaker constraint flagged: ${dealbreakerDetails}`);
  }
  if (aStyle !== bStyle) {
    potentialFriction.push(`Different natural communication styles (${aStyle} vs ${bStyle})`);
  }

  const structuredReport: StructuredDateReport = {
    summary: `Simulated date between ${participantA.displayName} and ${participantB.displayName} exploring ${commonTopic}, communication expectations, and relationship visions.`,
    sharedInterests: interestsResult.shared.length > 0 ? interestsResult.shared : [commonTopic],
    potentialFriction,
    conversationalEngagementScore: engagementScore,
    dealbreakerDetected,
    dealbreakerDetails: dealbreakerDetected ? dealbreakerDetails : undefined,
    vibeNotes: dealbreakerDetected
      ? 'A major incompatibility constraint was detected during the date dialogue.'
      : `Warm, constructive dialogue with mutual respect and curiosity regarding ${commonTopic}.`,
  };

  const sortedIds = [participantA.id, participantB.id].sort();
  const dateId = `pair_${sortedIds[0]}_${sortedIds[1]}`;

  return {
    id: dateId,
    participantAId: participantA.id,
    participantBId: participantB.id,
    startedAt,
    completedAt: new Date().toISOString(),
    status: 'completed',
    turnsCount: transcript.length,
    transcript,
    structuredReport,
    simulationMode: 'deterministic',
    modelUsed: 'deterministic-agent-v1',
  };
}

/**
 * Gemini LLM date simulation adapter
 */
export async function simulateGeminiDate(
  participantA: Participant,
  participantB: Participant,
  apiKey: string,
  modelName: string = 'gemini-1.5-flash'
): Promise<SimulatedDate> {
  const personaA = buildAgentPersona(participantA);
  const personaB = buildAgentPersona(participantB);

  const prompt = `
You are the Agent Simulation Engine for an ethical, consenting dating research platform.
Generate a realistic 6-turn date conversation between two AI agents representing human participants:

PARTICIPANT A:
${personaA}

PARTICIPANT B:
${personaB}

INSTRUCTIONS:
1. Generate an exchange of exactly 6 turns (A -> B -> A -> B -> A -> B).
2. The conversation must reflect their verified interests, communication styles, and relationship goals.
3. If either agent's dealbreakers are violated, have them address the incompatibility respectfully.
4. Output MUST be valid JSON adhering strictly to this schema:
{
  "transcript": [
    {
      "turnIndex": 1,
      "speakerId": "${participantA.id}",
      "speakerName": "${participantA.displayName}",
      "intent": "greeting",
      "message": "string"
    }
  ],
  "summary": "string summary",
  "sharedInterests": ["string"],
  "potentialFriction": ["string"],
  "conversationalEngagementScore": 75,
  "dealbreakerDetected": false,
  "vibeNotes": "string"
}
Output only pure raw JSON without markdown code fences.
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini API returned empty response');
  }

  const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  const transcript: DateTurn[] = (parsed.transcript || []).map((t: any, idx: number) => ({
    turnIndex: idx + 1,
    speakerId: t.speakerId || (idx % 2 === 0 ? participantA.id : participantB.id),
    speakerName: t.speakerName || (idx % 2 === 0 ? participantA.displayName : participantB.displayName),
    intent: t.intent || 'sharing',
    message: t.message,
    timestamp: new Date().toISOString(),
  }));

  const sortedIds = [participantA.id, participantB.id].sort();
  const dateId = `pair_${sortedIds[0]}_${sortedIds[1]}`;

  return {
    id: dateId,
    participantAId: participantA.id,
    participantBId: participantB.id,
    startedAt: new Date(Date.now() - 30000).toISOString(),
    completedAt: new Date().toISOString(),
    status: 'completed',
    turnsCount: transcript.length,
    transcript,
    structuredReport: {
      summary: parsed.summary || 'Simulated conversation generated via Gemini LLM',
      sharedInterests: parsed.sharedInterests || [],
      potentialFriction: parsed.potentialFriction || [],
      conversationalEngagementScore: parsed.conversationalEngagementScore || 70,
      dealbreakerDetected: !!parsed.dealbreakerDetected,
      dealbreakerDetails: parsed.dealbreakerDetails,
      vibeNotes: parsed.vibeNotes || 'Conversation generated using Gemini LLM agent representation.',
    },
    simulationMode: 'gemini',
    modelUsed: modelName,
  };
}

/**
 * Main simulation runner with mode routing and fallback protection
 */
export async function runSimulatedDate(
  participantA: Participant,
  participantB: Participant,
  options?: SimulationOptions
): Promise<SimulatedDate> {
  const mode = options?.mode || 'deterministic';
  const apiKey = options?.apiKey || process.env.GEMINI_API_KEY || (typeof global !== 'undefined' && (global as any).__OVERRIDE_GEMINI_KEY);

  if (mode === 'gemini') {
    if (!apiKey) {
      console.warn('[Simulator] Gemini API key not found. Using deterministic fallback.');
      const res = simulateDeterministicDate(participantA, participantB);
      res.structuredReport.vibeNotes += ' (Fell back to deterministic simulator: Gemini API key not provided)';
      return res;
    }

    try {
      return await simulateGeminiDate(participantA, participantB, apiKey, options?.model);
    } catch (err: any) {
      console.error('[Simulator] Gemini LLM simulation failed, safely falling back to deterministic:', err.message);
      const res = simulateDeterministicDate(participantA, participantB);
      res.structuredReport.vibeNotes += ` (Fell back to deterministic simulator: ${err.message})`;
      return res;
    }
  }

  // Deterministic mode
  if (options?.delayMs && options.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, options.delayMs));
  }
  return simulateDeterministicDate(participantA, participantB);
}
