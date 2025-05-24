import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { imageGenerationService } from '../services/index.js';
import type { GenerateImageRequest } from '../types/index.js';

export default async function imageRoutes(fastify: FastifyInstance) {
  // Generate image
  fastify.post('/api/generate-image', async (req: FastifyRequest<{
    Body: GenerateImageRequest
  }>, reply: FastifyReply) => {
    try {
      req.log.info('Starting image generation...');
      const response = await imageGenerationService.generateImage(req.body);
      reply.send(response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      req.log.error('Error in generate-image:', error);

      if (errorMessage.includes('Missing required fields')) {
        return reply.status(400).send({
          error: 'Missing required fields',
          details: 'refImageUrl1, refImageUrl2, and prompt are required',
          success: false,
        });
      }

      reply.status(500).send({
        error: 'Failed to generate image',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        success: false,
      });
    }
  });
}
