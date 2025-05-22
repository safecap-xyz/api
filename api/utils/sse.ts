import { FastifyReply } from 'fastify';

export const setupSSE = (reply: FastifyReply): void => {
  // Set SSE headers
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // Disable Nginx buffering
  });
};

export const sendEvent = (reply: FastifyReply, type: string, data: any): void => {
  if (!reply.sent) {
    const event = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    reply.raw.write(event);
  }
};
