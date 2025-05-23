// AgentKit Types
export interface AgentKitRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  logitBias?: Record<string, number>;
}

export interface AgentKitResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    text: string;
    index: number;
    logprobs: any;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AgentKitError {
  error: {
    message: string;
    type: string;
    code: number | string;
    param?: string;
  };
}
