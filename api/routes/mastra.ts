import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { mastraService } from '@services/mastraService.js';
import { setupSSE, sendEvent } from '../utils/sse.js';
import { handleError } from '../utils/error-handler.js';
import { OrchestrateRequest } from '../types/requests.js';

export default async function(app: FastifyInstance) {
  // Mastra message endpoint
  app.post<{ Body: { agentId: string; message: string } }>('/api/mastra/message', async (req, reply) => {
    console.log('Mastra route hit!', { url: req.url, method: req.method, body: req.body });
    try {
      const { agentId, message } = req.body;

      if (!agentId || !message) {
        return reply.status(400).send({ error: 'Agent ID and message are required' });
      }

      const response = await mastraService.sendMessage(agentId, message);
      return reply.send(response);
    } catch (error) {
      handleError(error, reply);
    }
  });

  // Agent Orchestration Endpoint with Server-Sent Events
  app.post<{ Body: OrchestrateRequest }>('/api/agent/orchestrate', {
    schema: {
      body: {
        type: 'object',
        required: ['task', 'apiKey'],
        properties: {
          task: { type: 'string' },
          apiKey: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    console.log('\n🚀 === ORCHESTRATE ENDPOINT CALLED ===');
    console.log('Request URL:', request.url);
    console.log('Request Method:', request.method);
    console.log('Request Headers:', JSON.stringify(request.headers, null, 2));
    console.log('Request Body:', JSON.stringify(request.body, null, 2));
    console.log('Timestamp:', new Date().toISOString());
    console.log('=======================================\n');

    // Set up SSE response
    setupSSE(reply);

    const sendEventWrapper = (type: string, data: any) => {
      console.log(`📡 SSE Event - Type: ${type}, Data:`, JSON.stringify(data, null, 2));
      sendEvent(reply, type, data);
    };

    try {
      const { task, apiKey } = request.body;

      console.log('🔐 API Key Validation...');
      console.log('NODE_ENV:', process.env.NODE_ENV);

      // Simple API key validation
      if (apiKey !== process.env.API_KEY && apiKey !== 'dev-key' && process.env.NODE_ENV !== 'development') {
        console.log('❌ API Key validation failed');
        sendEventWrapper('error', { message: 'Invalid API key' });
        reply.raw.end();
        return;
      }

      console.log('✅ API Key validation passed');
      sendEventWrapper('start', { message: 'Starting agent orchestration' });

      console.log('\n🧠 === PREPARING ANALYSIS PROMPT ===');
      // Example analysis prompt that should trigger tool usage
      const analysisPrompt = `Analyze the following user task and recommend a course of action: "${task}"

You should use available tools to gather current information. If the task involves location-based information, weather, or current conditions, please use the appropriate tools to get real-time data.

Provide a structured response with:
- analysis: What is the user asking for?
- actions: What actions should be taken?
- reasoning: Brief explanation of your recommendations
- data: Any relevant current data you gathered using tools`;

      console.log('Analysis Prompt:', analysisPrompt);
      console.log('Task being analyzed:', task);
      console.log('=====================================\n');

      console.log('🤖 === CALLING FIRST AGENT (Analysis) ===');
      console.log('Agent ID: example-agent');
      console.log('Expecting tool usage...');
      // First agent gets the data
      const analysisResponse = await mastraService.sendMessage('example-agent', analysisPrompt);
      console.log('Agent 1 raw response:', JSON.stringify(analysisResponse, null, 2));

      console.log('\n🔍 === ANALYSIS RESPONSE INSPECTION ===');
      console.log('Response success:', analysisResponse?.success);
      console.log('Response has data:', !!analysisResponse?.data);
      if (analysisResponse?.data) {
        console.log('Response content:', analysisResponse.data.parts?.[0]?.text);
        console.log('Tool calls detected:', !!analysisResponse.data.tool_calls);
        if (analysisResponse.data.tool_calls) {
          console.log('Tool calls:', JSON.stringify(analysisResponse.data.tool_calls, null, 2));
        }
      }
      console.log('===========================================\n');

      sendEventWrapper('analysis', {
        message: 'Analysis completed',
        data: analysisResponse
      });

      console.log('⏳ === INTER-AGENT PROCESSING DELAY ===');
      console.log('Waiting 1 second between agents...');
      // Allow some processing time between agents
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Delay completed, proceeding to second agent');
      console.log('=========================================\n');

      console.log('🤖 === CALLING SECOND AGENT (Formatting) ===');
      // Second agent formats the response
      const formatPrompt = `Take the following analysis and format it into a user-friendly response:

${JSON.stringify(analysisResponse, null, 2)}

Make it conversational and helpful.`;

      console.log('Format Prompt:', formatPrompt);
      console.log('Agent ID: example-agent');
      console.log('Input data size:', JSON.stringify(analysisResponse).length, 'characters');

      const formattedResponse = await mastraService.sendMessage('example-agent', formatPrompt);
      console.log('Agent 2 raw response:', JSON.stringify(formattedResponse, null, 2));

      console.log('\n🔍 === FORMAT RESPONSE INSPECTION ===');
      console.log('Response success:', formattedResponse?.success);
      console.log('Response has data:', !!formattedResponse?.data);
      if (formattedResponse?.data) {
        console.log('Formatted content:', formattedResponse.data.parts?.[0]?.text);
      }
      console.log('==========================================\n');

      sendEventWrapper('result', {
        message: 'Orchestration completed',
        data: formattedResponse
      });

      console.log('🏁 === ORCHESTRATION COMPLETION ===');
      console.log('Total agents called: 2');
      console.log('Final result delivered via SSE');
      // Send completion event and end the SSE connection
      sendEventWrapper('complete', { message: 'Processing complete' });
      console.log('SSE connection ended');
      console.log('===================================\n');
      reply.raw.end();
    } catch (error) {
      console.log('\n❌ === ORCHESTRATION ERROR OCCURRED ===');
      console.log('Error timestamp:', new Date().toISOString());
      console.log('Error type:', error?.constructor?.name);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('Error message:', errorMessage);

      if (error instanceof Error) {
        console.log('Error stack:', error.stack);
      }

      console.log('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('Error in agent orchestration:', error);

      console.log('Sending error event to client via SSE...');
      sendEventWrapper('error', {
        message: `Orchestration failed: ${errorMessage}`
      });
      console.log('Ending SSE connection due to error');
      console.log('=======================================\n');
      reply.raw.end();
    }
  });
}
