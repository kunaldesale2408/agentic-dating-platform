import { describe, it, expect } from 'vitest';
import {
  calculateDirectedCompatibility,
  computeSharedInterests,
  computeGoalsCompatibility,
  computeLifestyleScore,
  evaluateDealbreakers,
  computeRankingsForParticipant,
} from '../lib/compatibility';
import { Participant, SimulatedDate } from '../lib/types';

const baseParticipantA: Participant = {
  id: 'p_a',
  name: 'Alice Archer',
  displayName: 'Alice',
  linkedinUrl: 'https://linkedin.com/in/alice-archer-demo',
  instagramUrl: 'https://instagram.com/alice_archer',
  consentGiven: true,
  consentTimestamp: '2026-01-01T00:00:00Z',
  extractionStatus: 'extracted',
  bio: 'Architect passionate about sustainable urban housing and ceramics.',
  interests: ['Architecture', 'Ceramics', 'Jazz Records', 'Bouldering'],
  hobbies: ['Pottery', 'Film Photography'],
  communicationPreferences: { style: 'thoughtful', pace: 'measured', humor: 'witty' },
  relationshipGoals: 'Looking for a long-term life partner to build a calm, creative home.',
  dealbreakers: ['Active smoking or tobacco use'],
  evidence: [],
  unknowns: [],
  isSynthetic: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const baseParticipantB: Participant = {
  id: 'p_b',
  name: 'Bob Baker',
  displayName: 'Bob',
  linkedinUrl: 'https://linkedin.com/in/bob-baker-demo',
  instagramUrl: 'https://instagram.com/bob_baker',
  consentGiven: true,
  consentTimestamp: '2026-01-01T00:00:00Z',
  extractionStatus: 'extracted',
  bio: 'Acoustic engineer and sourdough enthusiast. Enjoys quiet weekends and bouldering.',
  interests: ['Acoustics', 'Ceramics', 'Bouldering', 'Sourdough'],
  hobbies: ['Pottery', 'Audio Foley'],
  communicationPreferences: { style: 'thoughtful', pace: 'measured', humor: 'dry' },
  relationshipGoals: 'Committed life partner who values creativity and quiet evenings.',
  dealbreakers: [],
  evidence: [],
  unknowns: [],
  isSynthetic: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('Compatibility Engine - Unit Tests', () => {
  it('computes shared interests correctly and detects overlap', () => {
    const res = computeSharedInterests(baseParticipantA, baseParticipantB);
    expect(res.score).toBeGreaterThanOrEqual(70);
    expect(res.shared).toContain('ceramics');
    expect(res.shared).toContain('bouldering');
    expect(res.isMissing).toBe(false);
  });

  it('handles missing data gracefully without marking as incompatible', () => {
    const emptyParticipant: Participant = {
      ...baseParticipantA,
      id: 'p_empty',
      interests: [],
      hobbies: [],
      relationshipGoals: '',
    };

    const resInterests = computeSharedInterests(emptyParticipant, baseParticipantB);
    expect(resInterests.isMissing).toBe(true);
    expect(resInterests.score).toBe(50); // neutral baseline, not 0!

    const resGoals = computeGoalsCompatibility(emptyParticipant, baseParticipantB);
    expect(resGoals.isMissing).toBe(true);
    expect(resGoals.score).toBe(50); // neutral baseline, not 0!

    const overall = calculateDirectedCompatibility(emptyParticipant, baseParticipantB, null);
    expect(overall.missingInformation.length).toBeGreaterThan(0);
    expect(overall.overallScore).toBeGreaterThanOrEqual(40);
  });

  it('detects and enforces hard dealbreaker constraints', () => {
    const smokerParticipant: Participant = {
      ...baseParticipantB,
      id: 'p_smoker',
      bio: 'Enjoys smoking vintage cigars on the patio while listening to records.',
    };

    // Alice has dealbreaker: "Active smoking or tobacco use"
    const dbCheck = evaluateDealbreakers(baseParticipantA, smokerParticipant);
    expect(dbCheck.triggered).toBe(true);
    expect(dbCheck.reasons.length).toBeGreaterThan(0);

    const ranking = calculateDirectedCompatibility(baseParticipantA, smokerParticipant, null);
    expect(ranking.dealbreakerTriggered).toBe(true);
    expect(ranking.overallScore).toBe(0); // Hard penalty overrides to 0
    expect(ranking.breakdown.dealbreakerPenalty).toBe(-100);
  });

  it('demonstrates directed ranking asymmetry when dealbreakers or goals differ', () => {
    const smokerParticipant: Participant = {
      ...baseParticipantB,
      id: 'p_smoker',
      bio: 'Enjoys smoking vintage cigars on the patio while listening to records.',
      dealbreakers: [], // Smoker has no dealbreaker against non-smokers
    };

    // Alice -> Smoker: Dealbreaker triggered! Score = 0
    const aliceRatingSmoker = calculateDirectedCompatibility(baseParticipantA, smokerParticipant, null);
    expect(aliceRatingSmoker.overallScore).toBe(0);
    expect(aliceRatingSmoker.dealbreakerTriggered).toBe(true);

    // Smoker -> Alice: No dealbreaker violated! Score > 0
    const smokerRatingAlice = calculateDirectedCompatibility(smokerParticipant, baseParticipantA, null);
    expect(smokerRatingAlice.overallScore).toBeGreaterThan(60);
    expect(smokerRatingAlice.dealbreakerTriggered).toBe(false);
  });

  it('ranks multiple candidates accurately with stable tie-breaking', () => {
    const candidateHigh: Participant = {
      ...baseParticipantB,
      id: 'c_high',
      name: 'High Match',
      interests: ['Architecture', 'Ceramics', 'Jazz Records', 'Bouldering'],
    };

    const candidateLow: Participant = {
      ...baseParticipantB,
      id: 'c_low',
      name: 'Low Match',
      interests: ['Skydiving', 'Taxidermy'],
      relationshipGoals: 'Casual hookups only, no strings attached',
    };

    const rankings = computeRankingsForParticipant(
      baseParticipantA,
      [candidateHigh, candidateLow],
      () => null
    );

    expect(rankings.length).toBe(2);
    expect(rankings[0].candidateParticipantId).toBe('c_high');
    expect(rankings[0].rank).toBe(1);
    expect(rankings[0].overallScore).toBeGreaterThan(rankings[1].overallScore);
    expect(rankings[1].candidateParticipantId).toBe('c_low');
    expect(rankings[1].rank).toBe(2);
  });
});
