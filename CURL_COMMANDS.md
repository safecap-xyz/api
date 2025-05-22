# Quick Mastra Service Test Commands

## Test the exact same request that's failing:

```bash
curl -X POST http://localhost:4111/mastra/agents/example-agent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Analyze the following user task and recommend a course of action: \"find the weather in NYC and tell me what to wear\"\n\nYou should use available tools to gather current information. If the task involves location-based information, weather, or current conditions, please use the appropriate tools to get real-time data.\n\nProvide a structured response with:\n- analysis: What is the user asking for?\n- actions: What actions should be taken?\n- reasoning: Brief explanation of your recommendations\n- data: Any relevant current data you gathered using tools\n\nPlease use tools to fetch current weather information if relevant to the task."
      }
    ]
  }' | jq '.'
```

## Simple weather test:

```bash
curl -X POST http://localhost:4111/mastra/agents/example-agent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What is the weather in New York City? Please use the get_weather tool."
      }
    ]
  }' | jq '.'
```

## Check agent configuration:

```bash
curl -X GET http://localhost:4111/mastra/agents/example-agent \
  -H "Content-Type: application/json" | jq '.'
```

## List available agents:

```bash
curl -X GET http://localhost:4111/mastra/agents \
  -H "Content-Type: application/json" | jq '.'
```

## Check tool definitions:

```bash
curl -X GET http://localhost:4111/mastra/agents/example-agent/tools \
  -H "Content-Type: application/json" | jq '.'
```

Run these commands to:
1. See if the Mastra service is responding correctly
2. Check if the agent has weather tools configured
3. Verify the tool call format matches what our service expects
