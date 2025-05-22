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
    
    for (const toolCall of toolCalls) {
      try {
        console.log('\n=== Handling Tool Call ===');
        console.log('Tool Call:', JSON.stringify(toolCall, null, 2));
        
        // Here you would normally execute the tool and get the result
        // For now, we'll just return a mock response
        const toolResult = {
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: JSON.stringify({
            status: 'success',
            data: `Mock response for ${toolCall.function.name} with args: ${toolCall.function.arguments}`
          })
        };
        
        console.log('Tool Result:', JSON.stringify(toolResult, null, 2));
        console.log('========================\n');
        
        toolResults.push(toolResult);
      } catch (error) {
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
      }
    }
    
    return toolResults;
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
      
      // Check for tool calls
      const msgFromAssistant = response.data?.choices?.[0]?.message;
      if (msgFromAssistant?.tool_calls?.length) {
        console.log('Tool calls detected, processing...');
        const toolCallResults = await this.handleToolCalls(msgFromAssistant.tool_calls);
        
        // If we have tool results, send them back to the agent
        if (toolCallResults.length > 0) {
          console.log('Sending tool results back to agent...');
          return this.sendMessage(agentId, message, taskId, toolCallResults);
        }
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
      
      // The response data is in response.data (Axios response object)
      const responseData = response.data;
      
      // Check for the new response structure (choices array at root or in data)
      const choices = responseData.choices || responseData.data?.choices;
      
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
