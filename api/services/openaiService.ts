/**
 * OpenAI service for handling completions and chat completions
 */
import { getEnv } from '../utils/env.js';

class OpenAIService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = getEnv('OPENAI_API_KEY', '', true);
    this.baseUrl = getEnv('OPENAI_API_URL', 'https://api.openai.com');
  }
  
  /**
   * Create a completion using OpenAI API
   */
  async createCompletion(prompt: string, model = 'gpt-3.5-turbo-instruct', maxTokens = 1000) {
    const response = await fetch(`${this.baseUrl}/v1/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        prompt,
        model,
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} ${JSON.stringify(error)}`);
    }
    
    return response.json();
  }
  
  /**
   * Create a chat completion using OpenAI API
   */
  async createChatCompletion(messages: Array<{
    role: 'user' | 'assistant' | 'system';
    name?: string;
    content: string;
  }>, model = 'gpt-3.5-turbo', maxTokens = 1000) {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        messages,
        model,
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} ${JSON.stringify(error)}`);
    }
    
    return response.json();
  }
}

// Export a singleton instance
export const openaiService = new OpenAIService();
