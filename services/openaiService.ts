import OpenAI from 'openai';
import { agentKitService } from './agentKitService.js';

export class OpenAIService {
  private openai: OpenAI | null = null;
  private isInitialized = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY is not set. OpenAI functionality will be disabled.');
      return;
    }

    this.openai = new OpenAI({
      apiKey,
    });
    this.isInitialized = true;
  }

  async createCompletion(prompt: string, model: string = 'gpt-3.5-turbo-instruct', maxTokens: number = 1000): Promise<any> {
    if (!this.openai) {
      throw new Error('OpenAI client is not initialized');
    }
    if (!this.isInitialized) {
      throw new Error('OpenAI service is not initialized');
    }

    try {
      // First, check if the prompt contains any on-chain data requests
      const shouldQueryChain = await this.needsOnChainData(prompt);
      
      let context = '';
      
      if (shouldQueryChain) {
        // Get relevant on-chain data using AgentKit
        try {
          // Example: Get balance if the prompt is about wallet balance
          if (prompt.toLowerCase().includes('balance') || prompt.toLowerCase().includes('how much')) {
            const addressMatch = prompt.match(/0x[a-fA-F0-9]{40}/);
            if (addressMatch) {
              const address = addressMatch[0];
              const balance = await agentKitService.getBalance(address);
              context = `On-chain data: The balance of address ${address} is ${balance} ETH.\n\n`;
            }
          }
          // Add more on-chain data queries as needed
        } catch (error) {
          console.error('Error fetching on-chain data:', error);
          context = 'Error fetching on-chain data. ';
        }
      }

      // Create the completion with the context
      const response = await this.openai.completions.create({
        model,
        prompt: context + prompt,
        max_tokens: maxTokens,
        temperature: 0.7,
      });

      return {
        id: response.id,
        object: 'text_completion',
        created: Math.floor(Date.now() / 1000),
        model: response.model,
        choices: response.choices.map(choice => ({
          text: choice.text,
          index: choice.index,
          logprobs: null,
          finish_reason: choice.finish_reason,
        })),
        usage: response.usage,
      };
    } catch (error) {
      console.error('Error in OpenAI completion:', error);
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error('OpenAI API error: Unknown error occurred');
    }
  }

  async createChatCompletion(
    messages: Array<{role: 'user' | 'assistant' | 'system'; name?: string; content: string}>, 
    model: string = 'gpt-3.5-turbo', 
    maxTokens: number = 1000
  ): Promise<any> {
    if (!this.openai) {
      throw new Error('OpenAI client is not initialized');
    }
    if (!this.isInitialized) {
      throw new Error('OpenAI service is not initialized');
    }

    try {
      // Check the last user message for on-chain data needs
      const lastUserMessage = messages
        .slice()
        .reverse()
        .find(m => m.role === 'user');

      let context = '';
      
      if (lastUserMessage) {
        const shouldQueryChain = await this.needsOnChainData(lastUserMessage.content);
        
        if (shouldQueryChain) {
          try {
            // Example: Get balance if the prompt is about wallet balance
            if (lastUserMessage.content.toLowerCase().includes('balance') || 
                lastUserMessage.content.toLowerCase().includes('how much')) {
              const addressMatch = lastUserMessage.content.match(/0x[a-fA-F0-9]{40}/);
              if (addressMatch) {
                const address = addressMatch[0];
                const balance = await agentKitService.getBalance(address);
                context = `On-chain data: The balance of address ${address} is ${balance} ETH.`;
                
                // Add the context as a system message
                messages = [
                  { role: 'system', content: 'You are a helpful assistant that can also provide on-chain data.' },
                  { role: 'system', content: context },
                  ...messages
                ];
              }
            }
            // Add more on-chain data queries as needed
          } catch (error) {
            console.error('Error fetching on-chain data:', error);
            context = 'Error fetching on-chain data.';
          }
        }
      }

      const response = await this.openai.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      });

      return {
        id: response.id,
        object: 'chat.completion',
        created: response.created,
        model: response.model,
        choices: response.choices,
        usage: response.usage,
      };
    } catch (error) {
      console.error('Error in OpenAI chat completion:', error);
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error(`OpenAI API error: ${String(error)}`);
    }
  }

  private async needsOnChainData(prompt: string): Promise<boolean> {
    // Simple check for common on-chain data requests
    const onChainKeywords = [
      'balance', 'transaction', 'block', 'address', 'wallet',
      'eth', 'ethereum', 'crypto', 'token', 'nft',
      'how much', 'what is the balance', 'check my', 'show me'
    ];
    
    const promptLower = prompt.toLowerCase();
    return onChainKeywords.some(keyword => promptLower.includes(keyword));
  }
}

// Export a singleton instance
export const openaiService = new OpenAIService();
