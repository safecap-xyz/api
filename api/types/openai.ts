/**
 * OpenAI-compatible API type definitions
 */

export interface OpenAICompletionRequest {
  prompt: string;
  model?: string;
  max_tokens?: number;
}

export interface OpenAIChatCompletionRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    name?: string;
    content: string;
  }>;
  model?: string;
  max_tokens?: number;
}

export interface OpenAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    text: string;
    index: number;
    logprobs: null;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
