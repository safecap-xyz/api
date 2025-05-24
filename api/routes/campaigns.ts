import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { Campaign } from '../types/index.js';

export default async function campaignRoutes(fastify: FastifyInstance) {
  // Get all campaigns
  fastify.get('/api/campaigns', async (req: FastifyRequest, reply: FastifyReply) => {
    console.log('CORS headers:', reply.getHeaders());
    // Use legacy db for backward compatibility
    reply.send(fastify.db.campaigns);
  });

  // Get campaign by ID
  fastify.get('/api/campaigns/:id', async (req: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    const { id } = req.params;
    const campaign = fastify.db.campaigns.find(c => c.id === id);

    if (!campaign) {
      return reply.code(404).send({ error: 'Campaign not found' });
    }

    reply.send(campaign);
  });

  // Create new campaign
  fastify.post('/api/campaigns', async (req: FastifyRequest<{
    Body: Omit<Campaign, 'id' | 'backers' | 'raised'>
  }>, reply: FastifyReply) => {
    try {
      const newCampaign: Campaign = {
        ...req.body,
        id: Date.now().toString(),
        backers: 0,
        raised: 0
      };
      fastify.db.campaigns.push(newCampaign);
      reply.code(201).send(newCampaign);
    } catch (error) {
      reply.code(400).send({ error: 'Invalid campaign data' });
    }
  });

  // Donate to campaign
  fastify.post('/api/campaigns/:id/donate', async (req: FastifyRequest<{
    Params: { id: string },
    Body: { amount: number }
  }>, reply: FastifyReply) => {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return reply.code(400).send({ error: 'Invalid donation amount' });
    }

    const campaign = fastify.db.campaigns.find(c => c.id === id);

    if (!campaign) {
      return reply.code(404).send({ error: 'Campaign not found' });
    }

    campaign.raised += amount;
    campaign.backers += 1;

    reply.send(campaign);
  });
}
