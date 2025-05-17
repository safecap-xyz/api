# SafeCap API

A Fastify-based API for the SafeCap platform, providing backend services for managing blockchain-based campaigns and user operations.

## Features

- Blockchain integration with Base (Mainnet and Sepolia Testnet)
- Campaign management (create, list, get details)
- Smart contract deployment and interaction
- User operation handling with account abstraction
- CORS support for web applications
- Environment-based configuration

## Prerequisites

- Node.js 16+ and npm
- Vercel CLI (for local development)
- Coinbase Developer Platform API credentials
- Alchemy API keys (for Base network access)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# CDP Configuration
CDP_API_KEY_ID=your_cdp_api_key_id
CDP_API_KEY_SECRET=your_cdp_api_key_secret
CDP_WALLET_SECRET=your_cdp_wallet_secret

# Alchemy RPC URLs
ALCHEMY_BASE_MAINNET_URL=your_mainnet_rpc_url
ALCHEMY_BASE_SEPOLIA_URL=your_sepolia_rpc_url

# Default network (base-mainnet or base-sepolia)
DEFAULT_NETWORK=base-mainnet
```

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

## Development

To run the server locally:

```bash
# Install Vercel CLI globally if not already installed
npm install -g vercel@latest

# Start development server
vercel dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Campaigns

- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns` - Create a new campaign

### User Operations

- `POST /api/sample-user-operation` - Execute a sample user operation on the blockchain
  - Body: `{ network?: 'base-mainnet' | 'base-sepolia' }`

## Deployment

### Vercel Deployment

Deploy using Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPOSITORY_URL&project-name=safecap-api&repository-name=safecap-api)

### Environment Variables in Production

Make sure to set all required environment variables in your Vercel project settings.

## CORS Configuration

The API is configured to accept requests from:
- http://localhost:5173
- http://localhost:3000
- https://www.safecap.xyz
- https://safecap.xyz

## License

MIT
