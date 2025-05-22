import { Agent } from '@mastra/core/agent';
import { openai } from '@ai-sdk/openai';

export const myAgent = new Agent({
  name: 'myAgent',
  instructions: 'My Agent Instructions',
  model: openai('gpt-4o'),
});
