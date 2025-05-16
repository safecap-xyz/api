import Fastify from 'fastify'

const app = Fastify({
  logger: true,
})

// SafeCap Campaign storage (would be replaced with blockchain interactions in production)
app.decorate('db', {
  campaigns: [
    {
      id: '1',
      title: 'Sustainable Ocean Cleanup Initiative',
      description: 'Funding for new technology to remove plastic waste from oceans.',
      goal: 5,
      raised: 2.5,
      creator: '0x123...456',
      backers: 12,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString() // 30 days from now
    },
    {
      id: '2',
      title: 'Community Solar Power Project',
      description: 'Help us bring renewable energy to underserved communities.',
      goal: 10,
      raised: 7.8,
      creator: '0x789...012',
      backers: 45,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString() // 15 days from now
    }
  ]
})

// API Routes for SafeCap
app.get('/api/campaigns', (req, reply) => {
  reply.send(app.db.campaigns)
})

app.get('/api/campaigns/:id', (req, reply) => {
  const campaign = app.db.campaigns.find(c => c.id === req.params.id)
  if (!campaign) {
    reply.code(404).send({ error: 'Campaign not found' })
    return
  }
  reply.send(campaign)
})

app.post('/api/campaigns', (req, reply) => {
  const newCampaign = {
    id: String(app.db.campaigns.length + 1),
    ...req.body,
    backers: 0,
    raised: 0
  }
  app.db.campaigns.push(newCampaign)
  reply.code(201).send(newCampaign)
})

app.post('/api/campaigns/:id/donate', (req, reply) => {
  const { amount } = req.body
  const campaign = app.db.campaigns.find(c => c.id === req.params.id)
  if (!campaign) {
    reply.code(404).send({ error: 'Campaign not found' })
    return
  }
  campaign.raised += Number(amount)
  campaign.backers += 1
  reply.send(campaign)
})

app.get('/', async (req, reply) => {
  return reply.status(200).type('text/html').send(html)
})

export default async function handler(req, reply) {
  await app.ready()
  app.server.emit('request', req, reply)
}

const html = `
<!DOCTYPE html>
<html lang="en">
  </head>
  <body>
  c
  </body>
</html>
`
