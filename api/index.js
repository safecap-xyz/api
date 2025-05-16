import Fastify from 'fastify'
import { CdpClient } from '@coinbase/cdp-sdk'
import dotenv from 'dotenv'
import { Client } from "@gradio/client"

// Load environment variables
dotenv.config()

// Initialize CDP client
const cdpClient = new CdpClient({
  apiKeyId: process.env.CDP_API_KEY_ID,
  apiKeySecret: process.env.CDP_API_KEY_SECRET,
  walletSecret: process.env.CDP_WALLET_SECRET,
})

const app = Fastify({
  logger: true,
})

// Register CORS plugin
await app.register(import('@fastify/cors'), {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://www.safecap.xyz', 'https://safecap.xyz'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  logLevel: 'debug'
})

// Log CORS settings
console.log('CORS Configuration:', {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://www.safecap.xyz', 'https://safecap.xyz'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
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

server.post('/api/sample-user-operation', async (req, reply) => {
  const { network = 'base-sepolia' } = req.body;

  try {
    console.log(`Testing sample user operation on network: ${network}`);

    // Use the sample data format that worked in the CDP SDK Wallet Toolkit
    // Create a new owner account
    const ownerName = `owner${Date.now().toString().slice(-5)}`;
    const owner = await cdpClient.evm.createAccount({
      name: ownerName,
      type: 'evm-server'
    });
    console.log(`Created owner account: ${owner.address}`);

    // Create a smart account
    const smartAccount = await cdpClient.evm.createSmartAccount({
      owner,
      network
    });
    console.log(`Created smart account: ${smartAccount.address}`);

    // Prepare contract deployment calls

    console.log('Sending user operation with processed contract data...');
    // Load Campaign bytecode from JSON file
    const campaignBytecode = campaignArtifact.bytecode;
    console.log('Loading Campaign bytecode from JSON file');
    console.log(`Bytecode length: ${campaignBytecode.length} bytes`);

    // Create the call data for contract deployment with constructor arguments
    const nftContractAddress = '0x1234567890123456789012345678901234567890'; // Placeholder NFT contract address
    const initialOwner = smartAccount.address; // Use our smart account as initial owner

    // Encode constructor arguments using ethers v6 AbiCoder
    const abiCoder = new ethers.AbiCoder();
    const constructorArgs = abiCoder.encode(
      ['address', 'address'],
      [nftContractAddress, initialOwner]
    );

    const callData = {
      to: '0x4c3bE7476AA6dEdD676063EFAA0229EF813735B4', // Deploying new contract
      value: '0',
      data: campaignBytecode + constructorArgs.slice(2) // Append constructor args to bytecode
    };

    // Send the user operation with the deployment call
    const result = await smartAccount.sendUserOperation({
      calls: [callData],
      network
    });

    console.log('UserOperation sent, userOpHash:', result.userOpHash);
    console.log('Waiting for UserOperation receipt...');

    let userOpReceipt = null;
    const maxAttempts = 20; // Poll for 20 * 3 = 60 seconds
    const pollInterval = 3000; // 3 seconds

    for (let i = 0; i < maxAttempts; i++) {
      try {
        userOpReceipt = await cdpClient.evm.getUserOperation({
          smartAccount: smartAccount,
          userOpHash: result.userOpHash,
        });
        if (userOpReceipt && userOpReceipt.status === 'complete' && userOpReceipt.success) {
          console.log('UserOperation was successful:', userOpReceipt);
          break;
        }
      } catch (error) {
        console.warn(`Attempt ${i + 1} to get receipt failed:`, error.message);
      }
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    let deployedContractAddress = null;
    let actualTransactionHash = result.transactionHash; // Fallback

    if (userOpReceipt && userOpReceipt.success) {
      console.log('UserOperation was successful.');
      // Get nonce from provider
      const provider = new ethers.JsonRpcProvider(network.rpcUrl);
      const nonce = await provider.getTransactionCount(smartAccount.address);

      deployedContractAddress = ethers.utils.getContractAddress({
        from: smartAccount.address,
        nonce
      });

      console.log('=== Deployed Contract Address (Calculated) ===');
      console.log('Deployed CampaignFactory Address:', deployedContractAddress);

      if (userOpReceipt.receipt && userOpReceipt.receipt.transactionHash) {
        actualTransactionHash = userOpReceipt.receipt.transactionHash;
        console.log('Actual on-chain transaction hash:', actualTransactionHash);
      }

    } else if (userOpReceipt) {
      console.error('UserOperation failed. Receipt:', userOpReceipt);
    } else {
      console.error('Failed to get UserOperation receipt after multiple attempts.');
    }

    console.log('=== Contract Deployment Details (from original callData) ===');
    console.log('  To:', callData.to);
    console.log('  Value:', callData.value);
    console.log('  Data (bytecode) length:', callData.data.length);

    // The `processedCalls` in this context is just the single deployment call
    const effectiveProcessedCalls = [callData];

    reply.send({
      success: true,
      ownerAddress: owner.address,
      smartAccountAddress: smartAccount.address,
      userOpHash: result.userOpHash,
      transactionHash: actualTransactionHash, // Use the one from receipt if available
      deployedContractAddress: deployedContractAddress, // Include the calculated address
      processedCalls: effectiveProcessedCalls,
      trackingInfo: {
        network,
        blockExplorerUrl: network === 'base-sepolia'
          ? `https://sepolia.basescan.org/tx/${actualTransactionHash}`
          : `https://basescan.org/tx/${actualTransactionHash}`
      },
      note: `Contract deployment initiated. Calculated Address: ${deployedContractAddress || 'N/A'}. Check the blockExplorerUrl with the transaction hash. For source code to appear on BaseScan, you must verify it on their platform after deployment.`
    });
  } catch (error) {
    console.error('Error sending sample user operation:', error);
    reply.code(500).send({ error: error.message || 'Failed to send sample user operation' });
  }
});

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

// CDP Routes
app.get('/api/list-accounts', async (req, reply) => {
  try {
    const { type } = req.query;
    let accounts = [];

    if (!type || type === 'evm') {
      const evmAccounts = await cdpClient.evm.listAccounts();
      accounts = [...accounts, ...evmAccounts];
    }

    if (!type || type === 'solana') {
      const solanaAccounts = await cdpClient.solana.listAccounts();
      accounts = [...accounts, ...solanaAccounts];
    }

    reply.send(accounts);
  } catch (error) {
    console.error('Error listing accounts:', error);
    reply.code(500).send({ error: error.message || 'Failed to list accounts' });
  }
});

app.post('/api/send-user-operation', async (req, reply) => {
  try {
    const { smartAccountAddress, network = 'base-sepolia', calls, ownerAddress } = req.body;

    if (!smartAccountAddress) {
      return reply.code(400).send({ error: 'Smart account address is required' });
    }

    // Get the owner account
    let ownerAccount;
    if (ownerAddress) {
      ownerAccount = await cdpClient.evm.getAccount({ address: ownerAddress });
    } else {
      ownerAccount = await cdpClient.evm.getOrCreateAccount({ name: 'default-owner' });
    }

    // Get the smart account
    const smartAccount = await cdpClient.evm.getSmartAccount({
      address: smartAccountAddress,
      network
    });

    // Create and send the user operation
    const result = await cdpClient.evm.sendUserOperation({
      smartAccount,
      owner: ownerAccount,
      calls,
      network
    });

    reply.send({
      success: true,
      userOpHash: result.userOpHash,
      smartAccountAddress: smartAccount.address,
      ownerAddress: ownerAccount.address
    });
  } catch (error) {
    console.error('Error sending user operation:', error);
    reply.code(500).send({ error: error.message || 'Failed to send user operation' });
  }
});

app.post('/api/generate-image', async (req, reply) => {
  try {
    // Validate request body
    const { refImageUrl1, refImageUrl2, prompt } = req.body;
    if (!refImageUrl1 || !refImageUrl2 || !prompt) {
      return reply.code(400).send({ error: 'Missing required fields: refImageUrl1, refImageUrl2, prompt' });
    }

    // Fetch reference images
    const refImage1Blob = await (await fetch(refImageUrl1)).blob();
    const refImage2Blob = await (await fetch(refImageUrl2)).blob();

    // Initialize Gradio client
    const client = await Client.connect("ByteDance/DreamO");

    // Call Gradio predict API
    const result = await client.predict("/generate_image", {
      ref_image1: refImage1Blob,
      ref_image2: refImage2Blob,
      ref_task1: "id", // Default
      ref_task2: "ip", // Default
      prompt: prompt,
      seed: 7698454872441022867, // Default
      width: 1024,             // Default
      height: 1024,            // Default
      ref_res: 512,            // Default
      num_steps: 12,           // Default
      guidance: 3.5,           // Default
      true_cfg: 1,             // Default
      cfg_start_step: 0,       // Default
      cfg_end_step: 0,         // Default
      neg_prompt: "",          // Default
      neg_guidance: 1,         // Default
      first_step_guidance: 0,  // Default
    });

    // Send response
    reply.send(result.data);

  } catch (error) {
    app.log.error(error);
    reply.code(500).send({ error: 'Failed to generate image', details: error.message });
  }
});

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
