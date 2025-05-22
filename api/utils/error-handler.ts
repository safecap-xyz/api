import { FastifyReply } from 'fastify';

export interface ErrorWithCode extends Error {
  code?: string | number;
  statusCode?: number;
}

export const handleError = (error: unknown, reply: FastifyReply): void => {
  console.error('Error:', error);
  
  if (error instanceof Error) {
    const err = error as ErrorWithCode;
    const statusCode = err.statusCode || 500;
    
    reply.status(statusCode).send({
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err : undefined
    });
  } else {
    reply.status(500).send({
      error: 'An unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};
