export type ExtractionStatus = 'extracted' | 'manual' | 'partial' | 'failed';

export interface EvidenceItem {
  id: string;
  claim: string;
  source: 'linkedin' | 'instagram' | 'participant_provided';
  confidence: number; // 0.0 to 1.0
  snippet?: string;
  extractedAt: string;
}

export interface CommunicationPreferences {
  style: 'thoughtful' | 'playful' | 'direct' | 'reserved' | 'spontaneous';
  pace: 'measured' | 'fast' | 'adaptive';
  humor: 'dry' | 'witty' | 'warm' | 'sarcastic' | 'gentle';
}

export interface Participant {
  id: string;
  name: string;
  displayName: string;
  linkedinUrl: string;
  instagramUrl: string;
  consentGiven: boolean;
  consentTimestamp: string;
  extractionStatus: ExtractionStatus;
  bio: string;
  interests: string[];
  hobbies: string[];
  communicationPreferences: CommunicationPreferences;
  relationshipGoals: string;
  dealbreakers: string[];
  evidence: EvidenceItem[];
  unknowns: string[];
  isSynthetic: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DateTurn {
  turnIndex: number;
  speakerId: string;
  speakerName: string;
  message: string;
  intent: 'greeting' | 'inquiry' | 'sharing' | 'vulnerability' | 'humor' | 'boundary_check' | 'follow_up' | 'closing';
  timestamp: string;
}

export interface StructuredDateReport {
  summary: string;
  sharedInterests: string[];
  potentialFriction: string[];
  conversationalEngagementScore: number; // 0 - 100
  dealbreakerDetected: boolean;
  dealbreakerDetails?: string;
  vibeNotes: string;
}

export interface SimulatedDate {
  id: string;
  participantAId: string;
  participantBId: string;
  startedAt: string;
  completedAt: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  turnsCount: number;
  transcript: DateTurn[];
  structuredReport: StructuredDateReport;
  simulationMode: 'deterministic' | 'gemini';
  modelUsed: string;
}

export interface ScoreBreakdown {
  sharedInterestsScore: number;   // 0 - 100 (35% weight)
  goalsCompatibilityScore: number;// 0 - 100 (25% weight)
  conversationalScore: number;    // 0 - 100 (20% weight)
  lifestyleScore: number;         // 0 - 100 (20% weight)
  dealbreakerPenalty: number;     // 0 or -100
}

export interface DirectedRanking {
  targetParticipantId: string;
  candidateParticipantId: string;
  rank: number;
  overallScore: number; // 0 - 100
  breakdown: ScoreBreakdown;
  dealbreakerTriggered: boolean;
  dealbreakerReasons: string[];
  sharedInterests: string[];
  potentialFriction: string[];
  missingInformation: string[];
  suggestedNextQuestions: string[];
  narrativeReason: string;
  updatedAt: string;
}

export interface AppSettings {
  simulationMode: 'deterministic' | 'gemini';
  geminiApiKeyConfigured: boolean;
  geminiModel: string;
  maxConcurrency: number;
  deterministicDelayMs: number;
  dataMinimizationEnabled: boolean;
}

export interface SimulationJobProgress {
  totalPairs: number;
  completedPairs: number;
  failedPairs: number;
  status: 'idle' | 'running' | 'completed' | 'paused' | 'failed';
  currentPair?: string;
  startedAt?: string;
  finishedAt?: string;
  errorMessage?: string;
}
