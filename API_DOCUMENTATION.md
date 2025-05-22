# SafeCap API Documentation

This document provides comprehensive documentation for the SafeCap API, including all available endpoints, request/response formats, and example usage.

## Table of Contents
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Health Check](#health-check)
- [AgentKit Endpoints](#agentkit-endpoints)
- [CDP Endpoints](#cdp-endpoints)
- [Image Generation](#image-generation)
- [Mastra AI Endpoints](#mastra-ai-endpoints)
- [OpenAI Compatible Endpoints](#openai-compatible-endpoints)
- [Postman Collection](#postman-collection)

## Base URL

```
https://api.safecap.xyz
```

## Authentication

Most endpoints require authentication via API key. Include it in the `Authorization` header:

```
Authorization: Bearer YOUR_API_KEY
```

## Health Check

### Get API Status

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

**cURL:**
```bash
curl -X GET "https://api.safecap.xyz/api/health"
```

## AgentKit Endpoints

### Execute Sample User Operation

```http
POST /api/sample-user-operation
```

**Request Body:**
```json
{
  "network": "base-sepolia",
  "type": "transfer"
}
```

**Response:**
```json
{
  "operation": {
    "id": "op-1234567890",
    "network": "base-sepolia",
    "type": "transfer",
    "status": "created"
  },
  "success": true
}
```

**cURL:**
```bash
curl -X POST "https://api.safecap.xyz/api/sample-user-operation" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"network":"base-sepolia","type":"transfer"}'
```

### Get Account Info

```http
POST /api/agentkit/account-info
```

**Request Body:**
```json
{
  "ownerAddress": "0x...",
  "smartAccountAddress": "0x..."
}
```

**Response:**
```json
{
  "ownerAddress": "0x...",
  "smartAccountAddress": "0x...",
  "balance": "0.0",
  "network": "base-sepolia",
  "success": true
}
```

### Execute Agent Action

```http
POST /api/agentkit/execute
```

**Request Body:**
```json
{
  "action": "transfer",
  "params": {
    "to": "0x...",
    "amount": "1.0",
    "token": "ETH"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "actionId": "action-1234567890",
    "action": "transfer",
    "params": {
      "to": "0x...",
      "amount": "1.0",
      "token": "ETH"
    },
    "status": "executed"
  }
}
```

## CDP Endpoints

### Create Smart Account

```http
POST /api/create-smart-account
```

**Request Body:**
```json
{
  "ownerAddress": "0x...",
  "network": "base-sepolia"
}
```

**Response:**
```json
{
  "smartAccountAddress": "0x...",
  "ownerAddress": "0x...",
  "network": "base-sepolia"
}
```

### Create Wallet

```http
POST /api/create-wallet
```

**Request Body:**
```json
{
  "type": "eoa",
  "name": "My Wallet",
  "network": "base-sepolia"
}
```

**Response:**
```json
{
  "address": "0x...",
  "name": "My Wallet",
  "type": "eoa",
  "network": "base-sepolia"
}
```

## Image Generation

### Generate Image

```http
POST /api/generate-image
```

**Request Body:**
```json
{
  "refImageUrl1": "https://example.com/image1.jpg",
  "refImageUrl2": "https://example.com/image2.jpg",
  "prompt": "A beautiful landscape with mountains and a lake",
  "seed": 42,
  "width": 1024,
  "height": 1024,
  "num_steps": 30,
  "guidance": 7.0
}
```

**Response:**
```json
{
  "data": "base64_encoded_image_data",
  "success": true,
  "metadata": {
    "seed": 42,
    "width": 1024,
    "height": 1024,
    "prompt": "A beautiful landscape with mountains and a lake"
  }
}
```

## Mastra AI Endpoints

### Send Message

```http
POST /api/mastra/message
```

**Request Body:**
```json
{
  "agentId": "example-agent",
  "message": "Hello, how are you?"
}
```

### Agent Orchestration (SSE)

```http
POST /api/agent/orchestrate
```

**Request Body:**
```json
{
  "task": "Analyze this document and summarize the key points.",
  "apiKey": "your-api-key"
}
```

**Response:** Server-Sent Events (SSE) stream with the following event types:
- `start`: Orchestration started
- `analysis`: Analysis completed
- `result`: Final result
- `complete`: Processing complete
- `error`: Error occurred

## OpenAI Compatible Endpoints

### Create Completion

```http
POST /v1/completions
```

**Request Body:**
```json
{
  "prompt": "Once upon a time",
  "model": "text-davinci-003",
  "max_tokens": 50
}
```

### Create Chat Completion

```http
POST /v1/chat/completions
```

**Request Body:**
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ]
}
```

## Postman Collection

You can import the following JSON into Postman to get started quickly:

```json
{
  "info": {
    "name": "SafeCap API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": "{{base_url}}/api/health"
      }
    },
    {
      "name": "Create Smart Account",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{api_key}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"ownerAddress\": \"0x...\",\n  \"network\": \"base-sepolia\"\n}"
        },
        "url": "{{base_url}}/api/create-smart-account"
      }
    },
    {
      "name": "Generate Image",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{api_key}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"prompt\": \"A beautiful landscape with mountains and a lake\",\n  \"width\": 1024,\n  \"height\": 1024,\n  \"num_steps\": 30\n}"
        },
        "url": "{{base_url}}/api/generate-image"
      }
    },
    {
      "name": "Chat Completion",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{api_key}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"model\": \"gpt-3.5-turbo\",\n  \"messages\": [\n    {\"role\": \"system\", \"content\": \"You are a helpful assistant.\"},\n    {\"role\": \"user\", \"content\": \"Hello!\"}\n  ]\n}"
        },
        "url": "{{base_url}}/v1/chat/completions"
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "https://api.safecap.xyz",
      "type": "string"
    },
    {
      "key": "api_key",
      "value": "your_api_key_here",
      "type": "string"
    }
  ]
}
```

### Postman Environment Setup

1. Click on the "Environments" tab in Postman
2. Click "Add" to create a new environment
3. Add the following variables:
   - `base_url`: `https://api.safecap.xyz`
   - `api_key`: Your API key
4. Save the environment and select it from the environment dropdown

## Error Handling

All API endpoints return appropriate HTTP status codes along with error details in the response body:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

Common status codes:
- `200 OK`: Request successful
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid API key
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Rate Limiting

API rate limits are applied per API key:
- 60 requests per minute
- 1000 requests per day

## Support

For support, please contact support@safecap.xyz
