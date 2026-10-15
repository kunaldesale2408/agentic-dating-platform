import { describe, it, expect } from 'vitest';
import { simulateDeterministicDate, buildAgentPersona } from '../lib/agent-simulator';
import { SYNTHETIC_PARTICIPANTS } from '../lib/seed-data';

describe('Agent Simulation Engine', () => {
  const p1 = SYNTHETIC_PARTICIPANTS[0]; // Maya
  const p2 = SYNTHETIC_PARTICIPANTS[1]; // Julian

  it('builds a structured, verified agent persona from participant data', () => {
    const persona = buildAgentPersona(p1);
    expect(persona).toContain('Maya Lin Chen');
    expect(persona).toContain('Sustainable Architecture');
    expect(persona).toContain('LEED-certified urban housing');
    expect(persona).toContain('Active smoking or tobacco use');
  });

  it('generates a multi-turn date simulation with 6 distinct turns', () => {
    const date = simulateDeterministicDate(p1, p2);
    expect(date.id).toBe(`pair_${[p1.id, p2.id].sort()[0]}_${[p1.id, p2.id].sort()[1]}`);
    expect(date.status).toBe('completed');
    expect(date.turnsCount).toBe(6);
    expect(date.transcript.length).toBe(6);

    // Verify turn alternation
    expect(date.transcript[0].speakerId).toBe(p1.id);
    expect(date.transcript[1].speakerId).toBe(p2.id);
    expect(date.transcript[2].speakerId).toBe(p1.id);
    expect(date.transcript[3].speakerId).toBe(p2.id);
    expect(date.transcript[4].speakerId).toBe(p1.id);
    expect(date.transcript[5].speakerId).toBe(p2.id);

    // Verify structured date report
    expect(date.structuredReport).toBeDefined();
    expect(date.structuredReport.conversationalEngagementScore).toBeGreaterThanOrEqual(50);
    expect(date.structuredReport.conversationalEngagementScore).toBeLessThanOrEqual(100);
    expect(date.structuredReport.summary.length).toBeGreaterThan(10);
    expect(Array.isArray(date.structuredReport.sharedInterests)).toBe(true);
  });
});
