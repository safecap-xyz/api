import { FastifyCorsOptions } from '@fastify/cors';
import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';

// CORS configuration
export const corsOptions: FastifyCorsOptions = {
  origin: (origin, cb) => {
    // Allow any origin in development
    if (process.env.NODE_ENV === 'development') {
      cb(null, true);
      return;
    }
    
    // Define allowed origins for production
    const allowedOrigins = [
      'https://safecap.xyz',
      'https://www.safecap.xyz',
      'https://app.safecap.xyz'
    ];
    
    // Check if origin is allowed
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
      return;
    }
    
    cb(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Explicit CORS handler for specific routes
export function preHandler(request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) {
  const origin = request.headers.origin;
  
  // Set CORS headers
  reply.header('Access-Control-Allow-Origin', origin || '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  reply.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    reply.status(204).send();
    return;
  }
  
  done();
}
