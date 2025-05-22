#!/bin/bash

# Test Mastra Service Weather Tool Functionality
# This script tests the Mastra agent directly to debug tool calling

echo "=== Testing Mastra Agent Directly ==="
echo "URL: http://localhost:4111/mastra/agents/example-agent/generate"
echo ""

# Test 1: Simple weather request
echo "Test 1: Simple weather request"
curl -X POST http://localhost:4111/mastra/agents/example-agent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What is the weather in New York City? Please use the get_weather tool."
      }
    ]
  }' \
  | jq '.'

echo -e "\n\n=== Test 2: Weather with tool hint ==="

# Test 2: More explicit tool request
curl -X POST http://localhost:4111/mastra/agents/example-agent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "I need current weather information for NYC. Use your available weather tools to get this data."
      }
    ]
  }' \
  | jq '.'

echo -e "\n\n=== Test 3: Tool availability check ==="

# Test 3: Check what tools are available
curl -X POST http://localhost:4111/mastra/agents/example-agent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What tools do you have available? Can you list them?"
      }
    ]
  }' \
  | jq '.'

echo -e "\n\n=== Test 4: Direct function call test ==="

# Test 4: Try to see if agent tries to call functions
curl -X POST http://localhost:4111/mastra/agents/example-agent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Call the get_weather function with location parameter set to \"New York City\""
      }
    ]
  }' \
  | jq '.'

echo -e "\n\n=== Test 5: Weather clothing recommendation ==="

# Test 5: The exact prompt from the logs
curl -X POST http://localhost:4111/mastra/agents/example-agent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Analyze the following user task and recommend a course of action: \"find the weather in NYC and tell me what to wear\"\n\nYou should use available tools to gather current information. If the task involves location-based information, weather, or current conditions, please use the appropriate tools to get real-time data.\n\nProvide a structured response with:\n- analysis: What is the user asking for?\n- actions: What actions should be taken?\n- reasoning: Brief explanation of your recommendations\n- data: Any relevant current data you gathered using tools\n\nPlease use tools to fetch current weather information if relevant to the task."
    }
  ]' \
  | jq '.'

echo -e "\n\n=== Testing Complete ==="

# Save the output for analysis
echo ""
echo "To save output to file, run:"
echo "bash test_mastra.sh > mastra_test_results.json 2>&1"
