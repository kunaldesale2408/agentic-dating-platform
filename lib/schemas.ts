import { z } from 'zod';

// URL regex validation for LinkedIn and Instagram
const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/i;
const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/i;

export const participantInputSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(40),
  linkedinUrl: z.string().url('Must be a valid URL').refine((url) => {
    return linkedinRegex.test(url) || url.includes('linkedin.com');
  }, { message: 'Must be a valid LinkedIn public profile URL' }),
  instagramUrl: z.string().url('Must be a valid URL').refine((url) => {
    return instagramRegex.test(url) || url.includes('instagram.com');
  }, { message: 'Must be a valid Instagram public profile URL' }),
  consentGiven: z.literal(true, {
    errorMap: () => ({ message: 'You must give informed consent to participate in this experiment' }),
  }),
  bio: z.string().max(1000).optional().default(''),
  interests: z.array(z.string()).default([]),
  hobbies: z.array(z.string()).default([]),
  communicationPreferences: z.object({
    style: z.enum(['thoughtful', 'playful', 'direct', 'reserved', 'spontaneous']).default('thoughtful'),
    pace: z.enum(['measured', 'fast', 'adaptive']).default('measured'),
    humor: z.enum(['dry', 'witty', 'warm', 'sarcastic', 'gentle']).default('warm'),
  }).default({
    style: 'thoughtful',
    pace: 'measured',
    humor: 'warm',
  }),
  relationshipGoals: z.string().min(3, 'Please explicitly provide relationship goals').max(500),
  dealbreakers: z.array(z.string()).default([]),
  extractionMode: z.enum(['auto', 'manual']).default('auto'),
  rawExtractedText: z.string().max(3000).optional(),
});

export type ParticipantInput = z.infer<typeof participantInputSchema>;

export const singleDateRequestSchema = z.object({
  participantAId: z.string().min(1),
  participantBId: z.string().min(1),
  forceRerun: z.boolean().optional().default(false),
});

export const batchSimulationRequestSchema = z.object({
  concurrency: z.number().int().min(1).max(20).optional().default(5),
  mode: z.enum(['deterministic', 'gemini']).optional().default('deterministic'),
  pairIds: z.array(z.string()).optional(),
});

export const settingsUpdateSchema = z.object({
  simulationMode: z.enum(['deterministic', 'gemini']).optional(),
  geminiApiKey: z.string().optional(),
  geminiModel: z.string().optional(),
  maxConcurrency: z.number().int().min(1).max(20).optional(),
  deterministicDelayMs: z.number().int().min(0).max(1000).optional(),
  dataMinimizationEnabled: z.boolean().optional(),
});
