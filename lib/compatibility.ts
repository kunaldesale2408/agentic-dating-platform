import { Participant, SimulatedDate, ScoreBreakdown, DirectedRanking } from './types';

export interface CompatibilityWeights {
  sharedInterests: number; // default 0.35
  goals: number;           // default 0.25
  conversational: number;  // default 0.20
  lifestyle: number;       // default 0.20
}

export const DEFAULT_WEIGHTS: CompatibilityWeights = {
  sharedInterests: 0.35,
  goals: 0.25,
  conversational: 0.20,
  lifestyle: 0.20,
};

// Common goal clusters for semantic matching
const GOAL_CLUSTERS: Record<string, string[]> = {
  serious: ['marriage', 'family', 'long term', 'life partner', 'committed', 'building a home'],
  partnership: ['growth', 'companionship', 'co-creation', 'supportive partner', 'creative collaborator'],
  adventure: ['travel', 'spontaneous', 'shared experiences', 'adventure partner', 'explore'],
  mindful: ['emotional maturity', 'open communication', 'intentional dating', 'slow dating', 'depth'],
  casual: ['casual', 'see where it goes', 'no pressure', 'fun', 'new friends'],
};

/**
 * Normalizes text for keyword matching
 */
function normalize(str: string): string {
  return (str || '').toLowerCase().trim();
}

/**
 * 1. Shared Interests & Hobbies Score (0 - 100)
 */
export function computeSharedInterests(
  target: Participant,
  candidate: Participant
): { score: number; shared: string[]; isMissing: boolean } {
  const targetItems = [...(target.interests || []), ...(target.hobbies || [])].map(normalize);
  const candidateItems = [...(candidate.interests || []), ...(candidate.hobbies || [])].map(normalize);

  if (targetItems.length === 0 || candidateItems.length === 0) {
    // Missing data should not automatically count as incompatibility -> return neutral baseline
    return { score: 50, shared: [], isMissing: true };
  }

  const setB = new Set(candidateItems);
  const shared = targetItems.filter((item) => setB.has(item));

  // Compute Jaccard-like overlap
  const union = new Set([...targetItems, ...candidateItems]);
  const overlapRatio = union.size > 0 ? shared.length / Math.min(targetItems.length, candidateItems.length) : 0;

  // Scale: 3+ shared items gives 80-100, 1 gives ~60, 0 gives 35
  let score: number;
  if (shared.length >= 3) {
    score = Math.min(100, 75 + shared.length * 8);
  } else if (shared.length >= 1) {
    score = 55 + shared.length * 12;
  } else {
    // Check partial keyword overlap
    let partialMatches = 0;
    for (const t of targetItems) {
      for (const c of candidateItems) {
        if (t.includes(c) || c.includes(t)) {
          partialMatches++;
        }
      }
    }
    score = partialMatches > 0 ? Math.min(65, 45 + partialMatches * 8) : 35;
  }

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    shared: Array.from(new Set(shared)),
    isMissing: false,
  };
}

/**
 * 2. Goals Compatibility Score (0 - 100)
 */
export function computeGoalsCompatibility(
  target: Participant,
  candidate: Participant
): { score: number; alignment: string[]; friction: string[]; isMissing: boolean } {
  const tGoal = normalize(target.relationshipGoals);
  const cGoal = normalize(candidate.relationshipGoals);

  if (!tGoal || !cGoal) {
    return { score: 50, alignment: [], friction: ['One or both profiles did not specify relationship goals'], isMissing: true };
  }

  const tClusters = Object.entries(GOAL_CLUSTERS).filter(([, keywords]) =>
    keywords.some((k) => tGoal.includes(k))
  ).map(([name]) => name);

  const cClusters = Object.entries(GOAL_CLUSTERS).filter(([, keywords]) =>
    keywords.some((k) => cGoal.includes(k))
  ).map(([name]) => name);

  const matchedClusters = tClusters.filter((c) => cClusters.includes(c));
  const friction: string[] = [];

  // Check direct conflict (e.g., serious commitment vs purely casual)
  const isTargetSerious = tClusters.includes('serious');
  const isCandidateCasual = cClusters.includes('casual') && !cClusters.includes('serious');
  const isCandidateSerious = cClusters.includes('serious');
  const isTargetCasual = tClusters.includes('casual') && !tClusters.includes('serious');

  if ((isTargetSerious && isCandidateCasual) || (isTargetCasual && isCandidateSerious)) {
    friction.push('Goal horizon divergence: one seeks long-term marriage/commitment while the other prefers casual exploration');
    return { score: 25, alignment: [], friction, isMissing: false };
  }

  if (matchedClusters.length > 0) {
    const score = Math.min(100, 70 + matchedClusters.length * 15);
    return {
      score,
      alignment: matchedClusters.map((c) => `Aligned on ${c} relationship vision`),
      friction,
      isMissing: false,
    };
  }

  // Moderate alignment default if no explicit clash
  return {
    score: 60,
    alignment: ['Open-ended exploration with room for mutual definition'],
    friction,
    isMissing: false,
  };
}

/**
 * 3. Conversational Engagement Score from Date (0 - 100)
 */
export function computeConversationalScore(simulatedDate?: SimulatedDate | null): { score: number; notes: string; isMissing: boolean } {
  if (!simulatedDate || simulatedDate.status !== 'completed') {
    return { score: 50, notes: 'Date simulation pending or in progress', isMissing: true };
  }

  const base = simulatedDate.structuredReport?.conversationalEngagementScore ?? 65;
  const turns = simulatedDate.transcript?.length || 0;
  
  // High turn-taking with balanced interactions boosts engagement
  const score = Math.min(100, Math.max(0, base + (turns >= 6 ? 5 : 0)));
  return {
    score,
    notes: simulatedDate.structuredReport?.vibeNotes || 'Engaging exchange observed during simulated date',
    isMissing: false,
  };
}

/**
 * 4. Complementary Lifestyle & Communication Style (0 - 100)
 */
export function computeLifestyleScore(
  target: Participant,
  candidate: Participant
): { score: number; friction: string[] } {
  let score = 70;
  const friction: string[] = [];

  const tComm = target.communicationPreferences;
  const cComm = candidate.communicationPreferences;

  if (tComm && cComm) {
    // Style pairings
    if (tComm.style === cComm.style) {
      score += 15; // shared communication wavelength
    } else if (
      (tComm.style === 'direct' && cComm.style === 'reserved') ||
      (tComm.style === 'reserved' && cComm.style === 'direct')
    ) {
      score -= 10;
      friction.push('Communication contrast: direct vs reserved expression pace');
    } else {
      score += 5; // complementary
    }

    // Pace pairings
    if (tComm.pace === cComm.pace) {
      score += 10;
    } else if (
      (tComm.pace === 'fast' && cComm.pace === 'measured') ||
      (tComm.pace === 'measured' && cComm.pace === 'fast')
    ) {
      friction.push('Conversation pacing: one prefers fast-paced banter, other prefers measured reflection');
    }

    // Humor
    if (tComm.humor === cComm.humor) {
      score += 5;
    }
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    friction,
  };
}

/**
 * 5. Dealbreaker Conflict Detection
 * Evaluates whether Candidate triggers any of Target's explicit dealbreakers.
 */
export function evaluateDealbreakers(
  target: Participant,
  candidate: Participant
): { triggered: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const dealbreakers = target.dealbreakers || [];

  if (dealbreakers.length === 0) {
    return { triggered: false, reasons: [] };
  }

  const candidateText = normalize(
    [
      candidate.bio,
      ...(candidate.interests || []),
      ...(candidate.hobbies || []),
      candidate.relationshipGoals,
    ].join(' ')
  );

  for (const rawDb of dealbreakers) {
    const dbTerm = normalize(rawDb);
    if (!dbTerm) continue;

    // Pattern 1: Smoking / Vaping / Tobacco
    if (
      (dbTerm.includes('smok') || dbTerm.includes('tobacco') || dbTerm.includes('vape')) &&
      (candidateText.includes('smok') || candidateText.includes('cigar') || candidateText.includes('vaping'))
    ) {
      reasons.push(`Target dealbreaker "${rawDb}" triggered: candidate mentions smoking/tobacco habits.`);
    }

    // Pattern 2: Relocation / Long-distance
    if (
      (dbTerm.includes('long distance') || dbTerm.includes('relocation') || dbTerm.includes('remote only')) &&
      (candidateText.includes('frequent travel') || candidateText.includes('digital nomad') || candidateText.includes('always on the move'))
    ) {
      reasons.push(`Target dealbreaker "${rawDb}" triggered: candidate lifestyle relies on constant travel/nomadism.`);
    }

    // Pattern 3: Pet incompatibilities (e.g. "no pets", "severe cat allergy")
    if (
      dbTerm.includes('cat allergy') &&
      (candidateText.includes('cat') || candidateText.includes('kitten') || candidateText.includes('feline'))
    ) {
      reasons.push(`Target dealbreaker "${rawDb}" triggered: candidate has or lives with cats.`);
    }

    // Pattern 4: Children / Family readiness divergence
    if (
      (dbTerm.includes('no kids') || dbTerm.includes('childfree')) &&
      (candidateText.includes('wants children') || candidateText.includes('family with kids') || candidateText.includes('future children'))
    ) {
      reasons.push(`Target dealbreaker "${rawDb}" triggered: fundamental divergence on children.`);
    }

    // Pattern 5: Workaholism / Work-life balance
    if (
      dbTerm.includes('workaholic') &&
      (candidateText.includes('80-hour') || candidateText.includes('hustle 24/7') || candidateText.includes('always working'))
    ) {
      reasons.push(`Target dealbreaker "${rawDb}" triggered: candidate describes high-intensity nonstop work schedule.`);
    }
  }

  return {
    triggered: reasons.length > 0,
    reasons,
  };
}

/**
 * Generates tailored next questions for real human follow-up
 */
export function generateSuggestedQuestions(
  target: Participant,
  candidate: Participant,
  sharedInterests: string[],
  frictions: string[]
): string[] {
  const questions: string[] = [];

  if (sharedInterests.length > 0) {
    questions.push(`"What drew you initially into ${sharedInterests[0]}, and what's your favorite project or experience with it?"`);
  }

  if (frictions.length > 0) {
    questions.push(`"How do you usually like to balance personal downtime versus social and professional commitments?"`);
  } else {
    questions.push(`"When you envision an ideal Sunday together, how does the day unfold from morning to evening?"`);
  }

  questions.push(`"What is one value or personal boundary that has become non-negotiable for you over the last few years?"`);

  return questions;
}

/**
 * Calculates complete directed compatibility for Target evaluating Candidate
 */
export function calculateDirectedCompatibility(
  target: Participant,
  candidate: Participant,
  simulatedDate?: SimulatedDate | null,
  weights: CompatibilityWeights = DEFAULT_WEIGHTS
): DirectedRanking {
  const missingInformation: string[] = [];

  // 1. Shared Interests
  const interestsResult = computeSharedInterests(target, candidate);
  if (interestsResult.isMissing) missingInformation.push('Incomplete interest data');

  // 2. Goals Compatibility
  const goalsResult = computeGoalsCompatibility(target, candidate);
  if (goalsResult.isMissing) missingInformation.push('Unspecified relationship goals');

  // 3. Conversational Engagement
  const convResult = computeConversationalScore(simulatedDate);
  if (convResult.isMissing) missingInformation.push('Simulated date conversation pending');

  // 4. Lifestyle & Communication
  const lifestyleResult = computeLifestyleScore(target, candidate);

  // 5. Dealbreakers
  const dealbreakerResult = evaluateDealbreakers(target, candidate);

  // Raw weighted score calculation
  const rawScore =
    weights.sharedInterests * interestsResult.score +
    weights.goals * goalsResult.score +
    weights.conversational * convResult.score +
    weights.lifestyle * lifestyleResult.score;

  let overallScore = Math.round(Math.min(100, Math.max(0, rawScore)));
  let dealbreakerPenalty = 0;

  if (dealbreakerResult.triggered) {
    dealbreakerPenalty = -100;
    overallScore = 0; // Hard dealbreaker zeroes the overall score
  }

  const breakdown: ScoreBreakdown = {
    sharedInterestsScore: interestsResult.score,
    goalsCompatibilityScore: goalsResult.score,
    conversationalScore: convResult.score,
    lifestyleScore: lifestyleResult.score,
    dealbreakerPenalty,
  };

  const potentialFriction = [
    ...goalsResult.friction,
    ...lifestyleResult.friction,
  ];

  const suggestedNextQuestions = generateSuggestedQuestions(
    target,
    candidate,
    interestsResult.shared,
    potentialFriction
  );

  let narrativeReason = '';
  if (dealbreakerResult.triggered) {
    narrativeReason = `Compatibility precluded due to non-negotiable dealbreaker: ${dealbreakerResult.reasons.join(' ')}`;
  } else if (overallScore >= 80) {
    narrativeReason = `Exceptional alignment across shared passions (${interestsResult.shared.slice(0, 3).join(', ') || 'values'}), complementary communication, and mutual relationship expectations.`;
  } else if (overallScore >= 60) {
    narrativeReason = `Solid mutual potential with common conversational rhythm, though subtle differences in pacing or secondary hobbies require exploratory dialogue.`;
  } else {
    narrativeReason = `Lower mutual resonance attributable to distinct life priorities, divergent communication tempos, or limited shared everyday activities.`;
  }

  return {
    targetParticipantId: target.id,
    candidateParticipantId: candidate.id,
    rank: 1, // Will be set during list ranking sort
    overallScore,
    breakdown,
    dealbreakerTriggered: dealbreakerResult.triggered,
    dealbreakerReasons: dealbreakerResult.reasons,
    sharedInterests: interestsResult.shared,
    potentialFriction,
    missingInformation,
    suggestedNextQuestions,
    narrativeReason,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Computes sorted personalized rankings for a target participant across all candidates
 */
export function computeRankingsForParticipant(
  target: Participant,
  candidates: Participant[],
  datesLookup: (candId: string) => SimulatedDate | null
): DirectedRanking[] {
  const otherCandidates = candidates.filter((c) => c.id !== target.id);

  const rankings = otherCandidates.map((candidate) => {
    const date = datesLookup(candidate.id);
    return calculateDirectedCompatibility(target, candidate, date);
  });

  // Sort descending by overallScore; ties broken alphabetically by candidate name
  rankings.sort((a, b) => {
    if (b.overallScore !== a.overallScore) {
      return b.overallScore - a.overallScore;
    }
    const candA = candidates.find((c) => c.id === a.candidateParticipantId);
    const candB = candidates.find((c) => c.id === b.candidateParticipantId);
    return (candA?.name || '').localeCompare(candB?.name || '');
  });

  // Assign 1-indexed ranks
  return rankings.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}
