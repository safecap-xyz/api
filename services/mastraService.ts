import axios, { AxiosError } from 'axios';

// Define the expected message part type
interface MessagePart {
  type: string;
  text: string;
}

// Define the expected message type
interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

// Define proper message types for Mastra API
interface MastraUserMessage {
  role: 'user';
  content: string;
}

interface MastraAssistantMessage {
  role: 'assistant';
  content: string;
  tool_calls?: ToolCall[];
}

interface MastraToolMessage {
  role: 'tool';
  tool_call_id: string;
  content: string;
  name?: string;
}

type MastraMessage = MastraUserMessage | MastraAssistantMessage | MastraToolMessage;

interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  parts: MessagePart[];
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
  content?: string;
}

// Define the expected response type from Mastra API
interface MastraResponse {
  success: boolean;
  data?: {
    messages: MastraMessage[];
    choices?: Array<{
      message: MastraMessage;
      finish_reason?: string;
      index?: number;
    }>;
  };
  // Allow direct access to choices at the root level for backward compatibility
  choices?: Array<{
    message: MastraMessage;
    finish_reason?: string;
    index?: number;
  }>;
  error?: string;
  code?: number;
}

// Define the service response type
interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
  details?: unknown;
}

class MastraService {
  private baseUrl: string;
  private axiosInstance;

  constructor() {
    this.baseUrl = process.env.MASTRA_API_URL || 'https://api.mastra.ai/v1';
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MASTRA_API_KEY}`,
      },
      timeout: 60000, // 60 second timeout
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`[MastraService] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[MastraService] Request error:', error);
        return Promise.reject(error);
      }
    );
  }

  private async handleToolCalls(toolCalls: ToolCall[]): Promise<MastraToolMessage[]> {
    const toolResults: MastraToolMessage[] = [];
    
    for (const toolCall of toolCalls) {
      try {
        console.log(`\n🔧 Processing tool call: ${toolCall.function.name}`);
        console.log('Arguments:', toolCall.function.arguments);
        
        // In a real implementation, you would call the appropriate tool function here
        // For now, we'll just return a mock response
        const result = await this.executeTool(toolCall.function.name, JSON.parse(toolCall.function.arguments));
        
        toolResults.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: JSON.stringify(result),
        });
        
        console.log(`✅ Tool call ${toolCall.function.name} completed successfully`);
      } catch (error) {
        console.error(`❌ Error executing tool ${toolCall.function.name}:`, error);
        toolResults.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: JSON.stringify({ error: 'Tool execution failed' }),
        });
      }
    }
    
    return toolResults;
  }

  private async executeTool(name: string, args: Record<string, any>): Promise<any> {
    // In a real implementation, you would have actual tool functions here
    console.log(`Executing tool: ${name} with args:`, args);
    
    // Mock implementation - replace with actual tool calls
    switch (name) {
      case 'get_weather':
        return { temperature: 72, condition: 'sunny', location: args.location };
      case 'get_stock_price':
        return { symbol: args.symbol, price: 150.25, currency: 'USD' };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async sendMessageWithConversation(
    agentId: string,
    messages: MastraMessage[],
    taskId: string = crypto.randomUUID()
  ): Promise<ServiceResponse<AgentMessage>> {
    try {
      const url = `/mastra/agents/${agentId}/generate`;
      const requestData = { messages };
      const requestConfig = { params: { taskId } };

      console.log('\n=== Mastra API Request ===');
      console.log(`URL: ${this.baseUrl}${url}`);
      console.log('Method: POST');
      console.log('Headers:', {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer [REDACTED]',
      });
      console.log('Params:', requestConfig);
      console.log('Request Body:', JSON.stringify(requestData, null, 2));
      console.log('==========================\n');

      const startTime = Date.now();
      const response = await this.axiosInstance.post<MastraResponse>(
        url,
        requestData,
        requestConfig
      );
      const endTime = Date.now();

      console.log('\n=== Mastra API Response ===');
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Duration: ${endTime - startTime}ms`);
      console.log('Response Headers:', response.headers);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
      console.log('===========================\n');

      if (!response.data) {
        throw new Error('No response data received from Mastra API');
      }

      if (!response.data.success) {
        console.error('Mastra API request failed:', response.data);
        throw new Error('Request to Mastra API was not successful');
      }

      let assistantMessage: MastraMessage | undefined;
      const responseData = response.data;
      const choices = responseData.data?.choices;

      if (Array.isArray(choices) && choices.length > 0) {
        assistantMessage = choices[0].message;
      } else if (responseData.data?.messages && Array.isArray(responseData.data.messages)) {
        const messages = [...responseData.data.messages];
        assistantMessage = messages
          .reverse()
          .find((msg): msg is MastraMessage => !!msg && msg.role === 'assistant');
      } else {
        console.error('Unexpected response structure from Mastra API:', JSON.stringify(response, null, 2));
        throw new Error('Could not parse response from Mastra API: unexpected structure');
      }

      if (!assistantMessage) {
        throw new Error('No assistant message found in response');
      }

      // Transform the response to match our expected format
      const result: AgentMessage = {
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: assistantMessage.content || '',
          },
        ],
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message ||
                         axiosError.message ||
                         'Unknown error';
      const status = axiosError.response?.status || 'N/A';

      console.error(`Error sending conversation to agent ${agentId}:`, {
        error: errorMessage,
        status,
        data: axiosError.response?.data,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        error: `HTTP error! status: ${status} - ${errorMessage}`,
        details: axiosError.response?.data,
      };
    }
  }

  async sendMessage(
    agentId: string,
    message: string,
    taskId: string = crypto.randomUUID(),
    toolResults: any[] = []
  ): Promise<ServiceResponse<AgentMessage>> {
    try {
      const url = `/mastra/agents/${agentId}/generate`;
      const requestData = {
        messages: [
          {
            role: 'user',
            content: message,
          },
          ...toolResults
        ].filter(Boolean),
      };
      const requestConfig = {
        params: { taskId },
      };

      console.log('\n=== Mastra API Request ===');
      console.log(`URL: ${this.baseUrl}${url}`);
      console.log('Method: POST');
      console.log('Headers:', {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer [REDACTED]',
      });
      console.log('Params:', requestConfig);
      console.log('Request Body:', JSON.stringify(requestData, null, 2));
      console.log('==========================\n');

      const startTime = Date.now();
      const response = await this.axiosInstance.post<MastraResponse>(
        url,
        requestData,
        requestConfig
      );
      const endTime = Date.now();

      console.log('\n=== Mastra API Response ===');
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Duration: ${endTime - startTime}ms`);
      console.log('Response Headers:', response.headers);

      // Check for tool calls - handle nested data structure
      const responseData = response.data;
      const choices = responseData.data?.choices || [];
      const msgFromAssistant = choices[0]?.message;

      console.log('\n🔍 === TOOL CALL DETECTION ===');
      console.log('Response data structure:', {
        hasChoicesAtRoot: !!responseData.choices,
        hasChoicesNested: !!responseData.data?.choices,
        choicesUsed: choices ? 'found' : 'not found'
      });
      if (!msgFromAssistant) {
        throw new Error('No message received from assistant');
      }

      console.log('Message from assistant:', JSON.stringify(msgFromAssistant, null, 2));
      
      // Check if this is an assistant message with tool calls
      if (msgFromAssistant.role === 'assistant' && 'tool_calls' in msgFromAssistant) {
        const assistantMsg = msgFromAssistant as MastraAssistantMessage;
        
        if (!assistantMsg.tool_calls || !Array.isArray(assistantMsg.tool_calls) || assistantMsg.tool_calls.length === 0) {
          console.log('No valid tool calls found');
          throw new Error('No valid tool calls found');
        }
        
        console.log('✅ Tool calls detected, processing...');
        console.log('Tool calls array:', assistantMsg.tool_calls);
        
        const toolCallResults = await this.handleToolCalls(assistantMsg.tool_calls);

        // If we have tool results, send them back to the agent
        if (toolCallResults.length > 0) {
          console.log('📤 Sending tool results back to agent...');
          console.log('🔧 Building proper conversation with assistant message + tool results');

          // Build the complete conversation including the assistant message with tool_calls
          const conversationWithToolResults: MastraMessage[] = [
            {
              role: 'user',
              content: message
            } as MastraUserMessage,
            // Include the assistant message that made the tool calls
            {
              role: 'assistant',
              content: msgFromAssistant.content || '',
              tool_calls: msgFromAssistant.tool_calls
            } as MastraAssistantMessage,
            // Add all tool results
            ...toolCallResults
          ];

          console.log('Complete conversation being sent:', JSON.stringify(conversationWithToolResults, null, 2));

          // Send the complete conversation back to agent with a fresh call
          return this.sendMessageWithConversation(agentId, conversationWithToolResults, taskId);
        }
      } else {
        console.log('❌ No tool calls detected in response');
      }

      console.log('Response Data:', JSON.stringify(response.data, null, 2));
      console.log('===========================\n');

      if (!response.data) {
        throw new Error('No response data received from Mastra API');
      }

      if (!response.data.success) {
        console.error('Mastra API request failed:', response.data);
        throw new Error('Request to Mastra API was not successful');
      }

      let assistantMessage: MastraMessage | undefined;

      // Use the response data
      if (responseData.data?.choices && Array.isArray(responseData.data.choices) && responseData.data.choices.length > 0) {
        assistantMessage = responseData.data.choices[0].message;
        assistantMessage = choices[0].message;
      }
      // Fallback to the old structure (data.messages array)
      else if (responseData.data?.messages && Array.isArray(responseData.data.messages)) {
        const messages = [...responseData.data.messages];
        assistantMessage = messages
          .reverse()
          .find((msg): msg is MastraMessage => !!msg && msg.role === 'assistant');
      } else {
        console.error('Unexpected response structure from Mastra API:', JSON.stringify(response, null, 2));
        throw new Error('Could not parse response from Mastra API: unexpected structure');
      }

      if (!assistantMessage) {
        throw new Error('No assistant message found in response');
      }

      // Transform the response to match our expected format
      const result: AgentMessage = {
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: assistantMessage.content || '',
          },
        ],
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage = axiosError.response?.data?.message ||
                         axiosError.message ||
                         'Unknown error';
      const status = axiosError.response?.status || 'N/A';

      console.error(`Error sending message to agent ${agentId}:`, {
        error: errorMessage,
        status,
        data: axiosError.response?.data,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        error: `HTTP error! status: ${status} - ${errorMessage}`,
        details: axiosError.response?.data,
      };
    }
  }
}

// Export a singleton instance
export const mastraService = new MastraService();
