/**
 * OpenAI-compatible API routes
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { openaiService } from '../services/openaiService.js';
import { 
  OpenAICompletionRequest, 
  OpenAIChatCompletionRequest 
} from '../types/openai.js';

/**
 * Register OpenAI-compatible routes
 */
export function registerOpenAIRoutes(app: FastifyInstance) {
  // OpenAI completions endpoint
  app.post<{ Body: OpenAICompletionRequest }>('/v1/completions', async (req, reply) => {
    try {
      const { prompt, model, max_tokens } = req.body;
      
      if (!prompt) {
        return reply.status(400).send({ error: 'Prompt is required' });
      }
      
      // Forward to OpenAI service
      const response = await openaiService.createCompletion(prompt, model, max_tokens);
      
      return response;
    } catch (error) {
      console.error('Error in OpenAI completions endpoint:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return reply.status(500).send({ 
        error: {
          message: `Failed to create completion: ${errorMessage}`,
          type: 'api_error'
        }
      });
    }
  });

  // OpenAI chat completions endpoint
  app.post<{ Body: OpenAIChatCompletionRequest }>('/v1/chat/completions', async (req, reply) => {
    try {
      const { messages, model, max_tokens } = req.body;
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return reply.status(400).send({ 
          error: {
            message: 'Messages array is required and cannot be empty',
            type: 'invalid_request_error'
          }
        });
      }
      
      // Forward to OpenAI service
      const response = await openaiService.createChatCompletion(messages, model, max_tokens);
      
      return response;
    } catch (error) {
      console.error('Error in OpenAI chat completions endpoint:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return reply.status(500).send({ 
        error: {
          message: `Failed to create chat completion: ${errorMessage}`,
          type: 'api_error'
        }
      });
    }
  });
}
