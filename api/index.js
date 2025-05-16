import Fastify from 'fastify'
import FastifyVite from '@fastify/vite'
import { CdpClient } from '@coinbase/cdp-sdk'
import dotenv from 'dotenv'
import { readFile } from 'fs/promises'
import * as ethers from 'ethers'
import { Client } from "@gradio/client"

dotenv.config()

// Read the campaign factory artifact
const campaignArtifact = JSON.parse(await readFile('./src/contracts/Campaign.sol/Campaign.json', 'utf-8'))

const app = Fastify({
  logger: {
    transport: {
      target: '@fastify/one-line-logger'
    }
  }
})

// Initialize CDP client
const cdpClient = new CdpClient({
  apiKeyId: process.env.CDP_API_KEY_ID,
  apiKeySecret: process.env.CDP_API_KEY_SECRET,
  walletSecret: process.env.CDP_WALLET_SECRET,
})

await app.register(FastifyVite, {
  root: import.meta.url,
  renderer: '@fastify/react',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    manifest: true
  }
})

app.setErrorHandler((error, req, reply) => {
  console.error(error)
  reply.send({ error })
})

await app.vite.ready()

// SafeCap Campaign storage
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
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
    },
    {
      id: '2',
      title: 'Community Solar Power Project',
      description: 'Help us bring renewable energy to underserved communities.',
      goal: 10,
      raised: 7.8,
      creator: '0x789...012',
      backers: 45,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString()
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
  const campaignId = req.params.id

  const campaign = app.db.campaigns.find(c => c.id === campaignId)
  if (!campaign) {
    reply.code(404).send({ error: 'Campaign not found' })
    return
  }

  campaign.raised += parseFloat(amount)
  campaign.backers += 1

  reply.send({ success: true, campaign })
})

// CDP Wallet Toolkit API Routes
app.post('/api/create-wallet-direct', async (req, reply) => {
  const { type, name, network = 'base-sepolia' } = req.body;

  try {
    console.log(`Creating ${type} account with name: ${name}`);

    let newAccount;
    let transactionHash = '';

    if (type === 'EVM') {
      newAccount = await cdpClient.evm.getOrCreateAccount({ name });
      console.log('EVM account created:', newAccount.address);

      const faucetResult = await cdpClient.evm.requestFaucet({
        address: newAccount.address,
        network,
        token: "eth",
      });
      transactionHash = faucetResult.transactionHash;
      console.log('Faucet transaction hash:', transactionHash);
    } else if (type === 'SOLANA') {
      newAccount = await cdpClient.solana.getOrCreateAccount({ name });
      console.log('Solana account created:', newAccount.address);

      const faucetResult = await cdpClient.solana.requestFaucet({
        address: newAccount.address,
        token: "sol"
      });
      transactionHash = faucetResult.signature || '';
      console.log('Solana faucet transaction signature:', transactionHash);
    } else {
      throw new Error(`Unsupported account type: ${type}`);
    }

    reply.send({
      account: newAccount,
      transactionHash
    });
  } catch (error) {
    console.error('Error creating wallet:', error);
    reply.code(500).send({ error: error.message || 'Failed to create wallet' });
  }
});

app.get('/api/list-accounts', async (req, reply) => {
  const { type } = req.query;

  try {
    let accounts = [];

    if (!type || type === 'EVM') {
      const evmAccounts = await cdpClient.evm.listAccounts();
      accounts = [...accounts, ...evmAccounts.map(acc => ({ ...acc, type: 'EVM' }))];
    }

    if (!type || type === 'SOLANA') {
      const solanaAccounts = await cdpClient.solana.listAccounts();
      accounts = [...accounts, ...solanaAccounts.map(acc => ({ ...acc, type: 'SOLANA' }))];
    }

    reply.send({ accounts });
  } catch (error) {
    console.error('Error listing accounts:', error);
    reply.code(500).send({ error: error.message || 'Failed to list accounts' });
  }
});

app.post('/api/create-smart-account', async (req, reply) => {
  const { ownerAddress, network = 'base-sepolia' } = req.body;

  try {
    if (!ownerAddress) {
      throw new Error('Owner address is required');
    }

    console.log(`Creating smart account with owner: ${ownerAddress} on network: ${network}`);

    let ownerAccount;
    try {
      ownerAccount = await cdpClient.evm.getAccount({ address: ownerAddress });
    } catch (error) {
      const timestamp = Date.now().toString();
      const validName = `owner${timestamp.substring(timestamp.length - 8)}`;
      ownerAccount = await cdpClient.evm.getOrCreateAccount({
        name: validName
      });
    }

    const result = await cdpClient.evm.createSmartAccount({
      owner: ownerAccount,
      network
    });

    reply.send({
      smartAccountAddress: result.address,
      ownerAddress: ownerAccount.address,
      network
    });
  } catch (error) {
    console.error('Error creating smart account:', error);
    reply.code(500).send({ error: error.message || 'Failed to create smart account' });
  }
});

app.post('/api/send-user-operation', async (req, reply) => {
  const { smartAccountAddress, network = 'base-sepolia', calls, ownerAddress } = req.body;

  try {
    if (!smartAccountAddress) {
      throw new Error('Smart account address is required');
    }

    if (!calls || !Array.isArray(calls)) {
      throw new Error('Valid calls array is required');
    }

    if (!ownerAddress) {
      throw new Error('Owner address is required');
    }

    const formattedCalls = calls.map(call => ({
      to: call.to,
      value: call.value.toString(),
      data: call.data.startsWith('0x') ? call.data : `0x${call.data}`
    }));

    let ownerAccount;
    try {
      ownerAccount = await cdpClient.evm.getAccount({ address: ownerAddress });
    } catch (error) {
      const timestamp = Date.now().toString();
      const validName = `owner${timestamp.substring(timestamp.length - 8)}`;
      ownerAccount = await cdpClient.evm.getOrCreateAccount({
        name: validName
      });
    }

    const smartAccount = await cdpClient.evm.getSmartAccount({
      address: smartAccountAddress,
      network
    });

    const result = await smartAccount.sendUserOperation({
      calls: formattedCalls,
      network
    });

    reply.send({
      userOpHash: result.userOpHash,
      smartAccountAddress,
      network
    });
  } catch (error) {
    console.error('Error sending user operation:', error);
    reply.code(500).send({ error: error.message || 'Failed to send user operation' });
  }
});

app.post('/api/generate-image', async (req, reply) => {
  try {
    const { refImageUrl1, refImageUrl2, prompt } = req.body;
    if (!refImageUrl1 || !refImageUrl2 || !prompt) {
      return reply.code(400).send({ error: 'Missing required fields: refImageUrl1, refImageUrl2, prompt' });
    }

    const refImage1Blob = await (await fetch(refImageUrl1)).blob();
    const refImage2Blob = await (await fetch(refImageUrl2)).blob();

    const client = await Client.connect("ByteDance/DreamO");
    const result = await client.predict("/generate_image", {
      ref_image1: refImage1Blob,
      ref_image2: refImage2Blob,
      ref_task1: "id", // Default
      ref_task2: "ip", // Default
      prompt: prompt,
      seed: 7698454872441022867,
      width: 1024,
      height: 1024,
      ref_res: 512,
      num_steps: 12,
      guidance: 3.5,
      true_cfg: 1,
      cfg_start_step: 0,
      cfg_end_step: 0,
      neg_prompt: "",
      neg_guidance: 1,
      first_step_guidance: 0,
    });

    reply.send(result.data);
  } catch (error) {
    console.error(error);
    reply.code(500).send({ error: 'Failed to generate image', details: error.message });
  }
});

export default async function handler(req, reply) {
  await app.ready()
  app.server.emit('request', req, reply)
}
