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

interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  parts: MessagePart[];
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
  content?: string;
}

// Define the expected response type from Mastra API
interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface MastraMessage {
  role: string;
  content: string;
  model?: string;
  tool_calls?: ToolCall[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface MastraResponse {
  success: boolean;
  data?: {
    messages?: MastraMessage[];
    id?: string;
    object?: string;
    created?: number;
    model?: string;
    choices?: Array<{
      index: number;
      message: MastraMessage;
      finish_reason: string;
    }>;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
  choices?: Array<{
    index: number;
    message: MastraMessage;
    finish_reason: string;
  }>;
}

// Generic response type for our service
type ServiceResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
};

export class MastraService {
  private baseUrl: string;
  private axiosInstance;

  constructor() {
    this.baseUrl = process.env.MASTRA_BASE_URL || 'http://localhost:4111';
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to debug exactly what's being sent
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log('\n🔍 === AXIOS REQUEST INTERCEPTOR ===');
        console.log('URL:', config.url);
        console.log('Method:', config.method?.toUpperCase());
        console.log('Headers:', config.headers);
        if (config.data) {
          console.log('Request Data (raw):', config.data);
          if (typeof config.data === 'string') {
            try {
              const parsed = JSON.parse(config.data);
              console.log('Request Data (parsed):', JSON.stringify(parsed, null, 2));
              // Check for tool messages
              if (parsed.messages && Array.isArray(parsed.messages)) {
                parsed.messages.forEach((msg: any, idx: number) => {
                  if (msg.role === 'tool') {
                    console.log(`🔧 Tool message [${idx}] structure:`, {
                      hasRole: 'role' in msg,
                      hasToolCallId: 'tool_call_id' in msg,
                      hasName: 'name' in msg,
                      hasContent: 'content' in msg,
                      keys: Object.keys(msg)
                    });
                  }
                });
              }
            } catch (e) {
              console.log('Could not parse request data as JSON');
            }
          }
        }
        console.log('===================================\n');
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    console.log('MastraService initialized with baseUrl:', this.baseUrl);
  }

  /**
   * Send a message to an agent and get a response
   * @param agentId The ID of the agent to communicate with
   * @param message The message to send
   * @returns The agent's response
   */
  // Helper function to handle tool calls
  private async handleToolCalls(toolCalls: any[]): Promise<any[]> {
    const toolResults = [];

    console.log('\n🔧 === TOOL CALLS HANDLER INVOKED ===');
    console.log('Number of tool calls to process:', toolCalls.length);
    console.log('Tool calls array:', JSON.stringify(toolCalls, null, 2));
    console.log('=====================================\n');

    for (const toolCall of toolCalls) {
      try {
        console.log('\n=== Handling Tool Call ===');
        console.log('Tool Call ID:', toolCall.id);
        console.log('Tool Type:', toolCall.type);
        console.log('Function Name:', toolCall.function?.name);
        console.log('Function Arguments (raw):', toolCall.function?.arguments);

        let parsedArgs;
        try {
          parsedArgs = JSON.parse(toolCall.function?.arguments || '{}');
          console.log('Function Arguments (parsed):', parsedArgs);
        } catch (e) {
          console.log('Failed to parse arguments as JSON:', e);
          parsedArgs = {};
        }

        console.log('Tool Call:', JSON.stringify(toolCall, null, 2));

        // Check if this is a weather tool call
        const isWeatherTool = toolCall.function?.name?.toLowerCase().includes('weather') ||
                             toolCall.function?.name?.toLowerCase().includes('forecast') ||
                             JSON.stringify(parsedArgs).toLowerCase().includes('weather') ||
                             JSON.stringify(parsedArgs).toLowerCase().includes('temperature');

        console.log('🌤️ Is Weather Tool:', isWeatherTool);

        let toolResult;

        if (isWeatherTool) {
          console.log('🌤️ === WEATHER TOOL DETECTED ===');
          console.log('This appears to be a weather-related tool call');
          console.log('Function name:', toolCall.function?.name);
          console.log('Arguments:', parsedArgs);

          // TODO: Implement actual weather API call here
          // For now, return a realistic weather response
          const weatherData = {
            location: parsedArgs.location || parsedArgs.city || 'Default Location',
            temperature: 72,
            condition: 'partly cloudy',
            humidity: 65,
            wind_speed: 8,
            timestamp: new Date().toISOString()
          };

          toolResult = {
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolCall.function.name,
            content: JSON.stringify({
              status: 'success',
              data: weatherData,
              message: `Weather data retrieved for ${weatherData.location}`
            })
          };

          console.log('🌤️ Weather Tool Result:', JSON.stringify(toolResult, null, 2));
          console.log('===============================\n');
        } else {
          console.log('🔧 Generic tool call - using mock response');
          // Here you would normally execute the tool and get the result
          // For now, we'll just return a mock response
          toolResult = {
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolCall.function.name,
            content: JSON.stringify({
              status: 'success',
              data: `Mock response for ${toolCall.function.name} with args: ${toolCall.function.arguments}`,
              tool_type: 'generic'
            })
          };
        }

        console.log('Tool Result:', JSON.stringify(toolResult, null, 2));
        console.log('========================\n');

        // Ensure tool_call_id is properly set at root level
        if (!toolResult.tool_call_id) {
          console.error('WARNING: tool_call_id is missing from tool result!');
        }

        toolResults.push(toolResult);
      } catch (error) {
        console.log('\n❌ === TOOL CALL ERROR ===');
        console.log('Error occurred while handling tool call:', toolCall.id);
        console.log('Tool function name:', toolCall.function?.name);
        console.log('Error details:', error);
        console.error('Error handling tool call:', error);

        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: JSON.stringify({
            status: 'error',
            error: 'Failed to execute tool',
            details: error instanceof Error ? error.message : String(error)
          })
        });
        console.log('Error tool result added to results array');
        console.log('========================\n');
      }
    }

    console.log('\n🔧 === TOOL CALLS HANDLER COMPLETED ===');
    console.log('Total tool results generated:', toolResults.length);
    console.log('Tool results summary:', toolResults.map(r => ({
      id: r.tool_call_id,
      name: r.name,
      status: JSON.parse(r.content).status
    })));
    console.log('=======================================\n');

    return toolResults;
  }

  /**
   * Send a complete conversation to an agent (used for tool call follow-ups)
   * @param agentId The ID of the agent to communicate with
   * @param messages Complete conversation including tool calls and results
   * @param taskId Task ID for the conversation
   * @returns The agent's response
   */
  async sendMessageWithConversation(
    agentId: string,
    messages: any[],
    taskId: string = crypto.randomUUID()
  ): Promise<ServiceResponse<AgentMessage>> {
    try {
      const url = `/mastra/agents/${agentId}/generate`;
      const requestData = {
        messages: messages
      };
      const requestConfig = {
        params: { taskId },
      };

      // Debug: Verify tool messages have tool_call_id
      console.log('\n=== VERIFYING TOOL MESSAGES ===');
      messages.forEach((msg, index) => {
        if (msg.role === 'tool') {
          console.log(`Tool message [${index}]:`, {
            role: msg.role,
            tool_call_id: msg.tool_call_id,
            has_tool_call_id: !!msg.tool_call_id,
            content_preview: msg.content ? msg.content.substring(0, 50) + '...' : 'no content'
          });
          if (!msg.tool_call_id) {
            console.error(`ERROR: Tool message at index ${index} is missing tool_call_id!`);
          }
          // Log the entire tool message to see its structure
          console.log(`Full tool message [${index}]:`, JSON.stringify(msg, null, 2));
        }
      });
      console.log('================================\n');

      // Log the outgoing request
      console.log('\n=== Mastra API Request (Tool Conversation) ===');
      console.log(`URL: ${this.baseUrl}${url}`);
      console.log('Method: POST');
      console.log('Headers:', {
        'Content-Type': 'application/json',
      });
      console.log('Params:', requestConfig);
      console.log('Request Body:', JSON.stringify(requestData, null, 2));
      console.log('============================================\n');

      const startTime = Date.now();
      const response = await this.axiosInstance.post<MastraResponse>(
        url,
        requestData,
        requestConfig
      );
      const endTime = Date.now();

      // Log the response
      console.log('\n=== Mastra API Response (Tool Conversation) ===');
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Duration: ${endTime - startTime}ms`);
      console.log('Response Headers:', response.headers);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
      console.log('==============================================\n');

      if (!response.data) {
        throw new Error('No response data received from Mastra API');
      }

      if (!response.data.success) {
        console.error('Mastra API request failed:', response.data);
        throw new Error('Request to Mastra API was not successful');
      }

      // Parse the response using the same logic as sendMessage
      const responseData = response.data;
      const choices = responseData.choices || responseData.data?.choices;

      let assistantMessage: MastraMessage | undefined;

      if (Array.isArray(choices) && choices.length > 0) {
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
            text: assistantMessage.content,
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

      // Log the outgoing request
      console.log('\n=== Mastra API Request ===');
      console.log(`URL: ${this.baseUrl}${url}`);
      console.log('Method: POST');
      console.log('Headers:', {
        'Content-Type': 'application/json',
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

      // Log the response
      console.log('\n=== Mastra API Response ===');
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Duration: ${endTime - startTime}ms`);
      console.log('Response Headers:', response.headers);

      // Check for tool calls - handle nested data structure
      const responseData = response.data;
      const choices = responseData.choices || responseData.data?.choices;
      const msgFromAssistant = choices?.[0]?.message;

      console.log('\n🔍 === TOOL CALL DETECTION ===');
      console.log('Response data structure:', {
        hasChoicesAtRoot: !!responseData.choices,
        hasChoicesNested: !!responseData.data?.choices,
        choicesUsed: choices ? 'found' : 'not found'
      });
      console.log('Message from assistant:', JSON.stringify(msgFromAssistant, null, 2));
      console.log('Has tool_calls property:', !!msgFromAssistant?.tool_calls);
      console.log('Tool calls length:', msgFromAssistant?.tool_calls?.length);
      console.log('Tool calls array:', msgFromAssistant?.tool_calls);
      console.log('==============================\n');

      if (msgFromAssistant?.tool_calls?.length) {
        console.log('✅ Tool calls detected, processing...');
        const toolCallResults = await this.handleToolCalls(msgFromAssistant.tool_calls);

        // If we have tool results, send them back to the agent
        if (toolCallResults.length > 0) {
          console.log('📤 Sending tool results back to agent...');
          console.log('🔧 Building proper conversation with assistant message + tool results');

          // Build the complete conversation including the assistant message with tool_calls
          const conversationWithToolResults = [
            {
              role: 'user',
              content: message,
            },
            // Include the assistant message that made the tool calls
            {
              role: 'assistant',
              content: msgFromAssistant.content || '',
              tool_calls: msgFromAssistant.tool_calls
            },
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

      // Use the response data and choices already declared above
      // responseData and choices are already available from tool call detection section

      if (Array.isArray(choices) && choices.length > 0) {
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
            text: assistantMessage.content,
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

// Add axios to package.json if not already present
// Run: pnpm add axios
