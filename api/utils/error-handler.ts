import { FastifyReply } from 'fastify';

export function handleError(error: unknown, reply: FastifyReply) {
  console.error('Error in route handler:', error);
  
  if (error instanceof Error) {
    return reply.status(500).send({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
  
  return reply.status(500).send({
    error: 'An unknown error occurred',
    details: String(error)
  });
}
