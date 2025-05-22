// OpenAI-compatible API interfaces

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
