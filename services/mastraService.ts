import { MastraClient } from '@mastra/client-js';

// Define the expected message part type
interface MessagePart {
  type: string;
  text: string;
}

// Define the expected message type
interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  parts: MessagePart[];
}

// Define the expected response type from Mastra A2A
interface TaskResponse {
  task: {
    id: string;
    status: string;
    result?: AgentMessage;
    error?: string;
  };
}

// Generic response type for our service
type ServiceResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export class MastraService {
  private mastraClient: MastraClient;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.MASTRA_BASE_URL || 'http://localhost:4111';
    this.mastraClient = new MastraClient({
      baseUrl: this.baseUrl,
    });
  }

  /**
   * Get an A2A client for a specific agent
   * @param agentId The ID of the agent to communicate with
   * @returns The A2A client instance
   */
  private getAgentClient(agentId: string) {
    return this.mastraClient.getA2A(agentId);
  }

  /**
   * Send a message to an agent and get a response
   * @param agentId The ID of the agent to communicate with
   * @param message The message to send
   * @param taskId Optional task ID for tracking the conversation
   * @returns The agent's response
   */
  async sendMessage(
    agentId: string, 
    message: string, 
    taskId: string = crypto.randomUUID()
  ): Promise<ServiceResponse<AgentMessage>> {
    try {
      const a2aClient = this.getAgentClient(agentId);
      
      const response = await a2aClient.sendMessage({
        id: taskId,
        message: {
          role: 'user',
          parts: [{ type: 'text', text: message }],
        },
      }) as unknown as TaskResponse;

      if (response.task.status !== 'completed' || !response.task.result) {
        throw new Error(response.task.error || 'Task did not complete successfully');
      }

      return {
        success: true,
        data: response.task.result,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error sending message to agent ${agentId}:`, errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

// Export a singleton instance
export const mastraService = new MastraService();
