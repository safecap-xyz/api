/**
 * Error handling utilities
 */
import { FastifyReply } from 'fastify';
import { ErrorResponse } from '../types/api.js';

/**
 * Standard API error class
 */
export class ApiError extends Error {
  statusCode: number;
  details?: unknown;
  
  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
  
  /**
   * Convert to response object
   */
  toResponse(): ErrorResponse {
    return {
      error: this.message,
      details: this.details,
      success: false
    };
  }
}

/**
 * Helper to create error responses
 * @param reply FastifyReply object
 * @param error Error object or string
 * @param statusCode HTTP status code
 */
export function sendError(reply: FastifyReply, error: Error | string, statusCode = 500): FastifyReply {
  const message = typeof error === 'string' ? error : error.message;
  const details = error instanceof ApiError ? error.details : undefined;
  
  return reply.status(statusCode).send({
    error: message,
    details,
    success: false
  });
}

/**
 * Validate that a required parameter exists
 * @param value Value to check
 * @param name Parameter name for the error message
 */
export function validateRequired(value: any, name: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ApiError(`${name} is required`, 400);
  }
}
