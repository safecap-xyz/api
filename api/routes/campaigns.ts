/**
 * Campaign related routes
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Campaign } from '../types/campaigns.js';

/**
 * Register Campaign routes
 */
export function registerCampaignRoutes(app: FastifyInstance) {
  // Get all campaigns
  app.get('/api/campaigns', (req: FastifyRequest, reply: FastifyReply) => {
    console.log('CORS headers:', reply.getHeaders());
    reply.send(app.db.campaigns);
  });

  // Get campaign by id
  app.get('/api/campaigns/:id', (req: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    const campaign = app.db.campaigns.find(c => c.id === req.params.id);
    if (!campaign) {
      reply.status(404).send({ error: 'Campaign not found' });
      return;
    }
    reply.send(campaign);
  });

  // Create a new campaign
  app.post('/api/campaigns', (req: FastifyRequest<{
    Body: Omit<Campaign, 'id' | 'raised' | 'backers'>
  }>, reply: FastifyReply) => {
    const { title, description, goal, creator, deadline } = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    
    const newCampaign: Campaign = {
      id,
      title,
      description,
      goal,
      raised: 0,
      creator,
      backers: 0,
      deadline
    };
    
    app.db.campaigns.push(newCampaign);
    reply.code(201).send(newCampaign);
  });

  // Donate to a campaign
  app.post('/api/campaigns/:id/donate', (req: FastifyRequest<{
    Params: { id: string },
    Body: { amount: number }
  }>, reply: FastifyReply) => {
    const campaign = app.db.campaigns.find(c => c.id === req.params.id);
    if (!campaign) {
      reply.status(404).send({ error: 'Campaign not found' });
      return;
    }
    
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      reply.status(400).send({ error: 'Valid amount is required' });
      return;
    }
    
    campaign.raised += amount;
    campaign.backers += 1;
    
    reply.send(campaign);
  });
}
