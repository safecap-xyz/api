import { FastifyInstance } from 'fastify';
import { openaiService } from '../../services/openaiService.js';
import { handleError } from '../utils/error-handler.js';
import { OpenAICompletionRequest, OpenAIChatCompletionRequest } from '../types/index.js';

export default async function(app: FastifyInstance) {
  // Ensure OpenAI service is initialized
  openaiService.initialize();

  // OpenAI Completions endpoint
  app.post<{ Body: OpenAICompletionRequest }>('/v1/completions', async (req, reply) => {
    try {
      const { prompt, model, max_tokens } = req.body;
      
      if (!prompt) {
        return reply.status(400).send({ error: 'Prompt is required' });
      }
      
      const result = await openaiService.createCompletion(prompt, model, max_tokens);
      return reply.send(result);
    } catch (error) {
      handleError(error, reply);
    }
  });

  // OpenAI Chat Completions endpoint
  app.post<{ Body: OpenAIChatCompletionRequest }>('/v1/chat/completions', async (req, reply) => {
    try {
      const { messages, model, max_tokens } = req.body;
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return reply.status(400).send({ error: 'Messages array is required' });
      }
      
      const result = await openaiService.createChatCompletion(messages, model, max_tokens);
      return reply.send(result);
    } catch (error) {
      handleError(error, reply);
    }
  });
}
