# API Refactoring Documentation

## Overview

The API has been refactored to separate concerns and improve maintainability. The monolithic `api/index.ts` file has been broken down into the following organized structure:

## Directory Structure

```
api/
├── index.ts              # Main server file (simplified)
├── types/
│   └── index.ts          # All TypeScript interfaces and types
├── config/
│   └── index.ts          # Configuration constants and settings
├── services/
│   └── index.ts          # Business logic and service classes
├── routes/
│   ├── index.ts          # Route module exports
│   ├── campaigns.ts      # Campaign-related endpoints
│   ├── cdp.ts           # CDP (Coinbase Developer Platform) endpoints
│   ├── images.ts        # Image generation endpoints
│   └── health.ts        # Health check and utility endpoints
├── utils/
│   ├── index.ts         # Utility function exports
│   ├── environment.ts   # Environment configuration utilities
│   └── cors.ts          # CORS configuration utilities
└── middleware/          # (existing directory for future middleware)
```

## What Was Extracted

### Types (`api/types/index.ts`)
- `NetworkConfig` and `NetworkConfigs` interfaces
- `Campaign` interface
- `UserOperationRequest` and `SampleUserOperationRequest` interfaces
- `ErrorResponse` interface
- Image generation types (`GenerateImageRequest`, `GenerateImageResponse`)
- CDP wallet types (`CreateWalletRequest`, `CreateSmartAccountRequest`, etc.)
- `NetworkType` type alias

### Configuration (`api/config/index.ts`)
- `NETWORK_CONFIG` constant
- `allowedOrigins` array
- `requiredVars` array for environment validation

### Services (`api/services/index.ts`)
- `CDPService` class: Handles CDP client initialization and operations
- `ImageGenerationService` class: Handles Gradio-based image generation
- `CampaignService` class: Handles campaign operations (in-memory database)
- Singleton instances exported for use across the application

### Routes
- **Campaigns** (`api/routes/campaigns.ts`): CRUD operations for campaigns
- **CDP** (`api/routes/cdp.ts`): Wallet creation, smart accounts, user operations
- **Images** (`api/routes/images.ts`): AI image generation endpoints
- **Health** (`api/routes/health.ts`): Health checks and utility endpoints

### Utilities (`api/utils/`)
- **Environment** (`environment.ts`): Environment loading and validation
- **CORS** (`cors.ts`): CORS configuration setup

## Benefits of Refactoring

1. **Separation of Concerns**: Each file has a single responsibility
2. **Maintainability**: Easier to find and modify specific functionality
3. **Testability**: Individual components can be tested in isolation
4. **Reusability**: Services and utilities can be reused across different parts of the application
5. **Type Safety**: All types are centralized and properly exported
6. **Scalability**: Easy to add new routes, services, or utilities

## Backward Compatibility

The refactoring maintains full backward compatibility:
- All existing API endpoints remain unchanged
- The campaign routes still use the legacy `fastify.db.campaigns` for data storage
- Environment variable handling remains the same
- CORS configuration is preserved
- All existing functionality is maintained

## Migration Path

For future development, you can gradually migrate to the new service-based approach:

1. **Replace Legacy Database**: Modify campaign routes to use `CampaignService` instead of `fastify.db.campaigns`
2. **Add Database Integration**: Replace in-memory storage with proper database connections
3. **Add Middleware**: Use the existing `middleware/` directory for authentication, validation, etc.
4. **Extend Services**: Add new business logic to service classes
5. **Add Tests**: Create unit tests for individual services and routes

## Usage Examples

### Adding a New Route
```typescript
// api/routes/newFeature.ts
import { FastifyInstance } from 'fastify';

export default async function newFeatureRoutes(fastify: FastifyInstance) {
  fastify.get('/api/new-feature', async (req, reply) => {
    reply.send({ message: 'New feature endpoint' });
  });
}

// Add to api/routes/index.ts
export { default as newFeatureRoutes } from './newFeature.js';

// Register in api/index.ts
import { newFeatureRoutes } from './routes/index.js';
await app.register(newFeatureRoutes);
```

### Adding a New Service
```typescript
// In api/services/index.ts
export class NewService {
  async performOperation(): Promise<any> {
    // Business logic here
  }
}

export const newService = new NewService();
```

### Adding New Types
```typescript
// In api/types/index.ts
export interface NewFeatureRequest {
  data: string;
  options?: Record<string, any>;
}
```

## Key Changes Made

1. **Main Index File**: Reduced from ~718 lines to ~100 lines
2. **Type Definitions**: Extracted to dedicated types file
3. **Business Logic**: Moved to service classes with proper error handling
4. **Route Handlers**: Separated into logical modules
5. **Configuration**: Centralized in config directory
6. **Utilities**: Reusable functions for common operations

## Next Steps

1. Consider adding proper database integration
2. Implement comprehensive error handling middleware
3. Add authentication and authorization middleware
4. Create unit and integration tests
5. Add API documentation (OpenAPI/Swagger)
6. Implement logging middleware
7. Add request validation middleware
