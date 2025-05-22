/**
 * Types index file - exports all type definitions
 */

export * from './agentkit.js';
export * from './campaigns.js';
export * from './api.js';
export * from './openai.js';

// Agent orchestration types
export interface OrchestrateRequest {
  task: string;
  apiKey: string;
}

// Mastra API types
export interface MastraMessageRequest {
  agentId: string;
  message: string;
}
