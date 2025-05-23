export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

export interface MastraMessageResponse {
  success: boolean;
  data?: {
    role: 'assistant' | 'user' | 'system' | 'tool';
    parts: Array<{
      type: string;
      text: string;
    }>;
    tool_calls?: Array<{
      id: string;
      type: string;
      function: {
        name: string;
        arguments: string;
      };
    }>;
  };
  error?: string;
  code?: number;
}

export interface OrchestrationResponse {
  success: boolean;
  data?: {
    analysis: string;
    actions: string[];
    reasoning: string;
    formattedResponse: string;
  };
  error?: string;
  code?: number;
}
