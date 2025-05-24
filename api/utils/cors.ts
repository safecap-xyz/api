import type { FastifyCorsOptions } from '@fastify/cors';
import { allowedOrigins } from '../config/index.js';

export function createCorsOptions(): FastifyCorsOptions {
  const corsOptions: FastifyCorsOptions = {
    // In production, only allow specific origins
    // In development, allow all origins
    origin: process.env.NODE_ENV === 'production'
      ? allowedOrigins
      : true, // Allow all in non-production

    // Allowed HTTP methods
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // Allowed request headers
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Request-Id',
      'X-Forwarded-For',
      'X-Real-IP',
      'Content-Length',
      'Accept-Encoding'
    ],

    // Exposed response headers
    exposedHeaders: [
      'Content-Length',
      'Content-Range',
      'X-Total-Count',
      'X-Request-Id',
      'Authorization'
    ],

    // Allow credentials (cookies, authorization headers)
    credentials: true,

    // Cache preflight requests for 1 hour (3600 seconds)
    maxAge: 3600,

    // Don't pass the CORS preflight response to the route handler
    preflightContinue: false,

    // Set the status code for OPTIONS requests
    optionsSuccessStatus: 204,

    // Enable CORS for all routes
    hideOptionsRoute: false
  };

  // Add debug logging for CORS configuration
  console.log('CORS Configuration:', {
    origin: corsOptions.origin,
    methods: corsOptions.methods,
    allowedHeaders: corsOptions.allowedHeaders,
    exposedHeaders: corsOptions.exposedHeaders,
    credentials: corsOptions.credentials,
    maxAge: corsOptions.maxAge
  });

  return corsOptions;
}
