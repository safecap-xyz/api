import { FastifyReply } from 'fastify';

export function setupSSE(reply: FastifyReply) {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // Disable buffering in Nginx
  });
  
  // Send a comment to initialize the connection
  reply.raw.write(':ok\n\n');
}

export function sendEvent(reply: FastifyReply, type: string, data: any) {
  try {
    const payload = JSON.stringify({ type, data });
    reply.raw.write(`data: ${payload}\n\n`);
  } catch (error) {
    console.error('Error sending SSE event:', error);
  }
}
