#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const server = new Server(
  {
    name: "gemini-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_content",
        description: "Generate content using Google Gemini AI",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The prompt to send to Gemini",
            },
            model: {
              type: "string",
              description: "The Gemini model to use (default: gemini-2.0-flash)",
              default: "gemini-2.0-flash",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "generate_hangout_locations",
        description: "Generate hangout location suggestions based on member preferences",
        inputSchema: {
          type: "object",
          properties: {
            locations: {
              type: "array",
              items: { type: "string" },
              description: "Array of member locations",
            },
            budget: {
              type: "number",
              description: "Average budget in INR",
            },
            moodTags: {
              type: "array",
              items: { type: "string" },
              description: "Array of mood/activity tags",
            },
          },
          required: ["locations", "budget", "moodTags"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "generate_content") {
    const { prompt, model = "gemini-2.0-flash" } = args;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${JSON.stringify(data)}`,
            },
          ],
        };
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

      return {
        content: [
          {
            type: "text",
            text: text,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }

  if (name === "generate_hangout_locations") {
    const { locations, budget, moodTags } = args;

    const prompt = `Create 3-4 hangout location suggestions for people from ${locations.join(", ")}.

Budget: ₹${budget}
Interests: ${moodTags.join(", ")}

Return ONLY valid JSON:
{
  "locations": [
    {
      "name": "Specific Area, City",
      "description": "Why this location is perfect",
      "itinerary": ["Place 1", "Place 2", "Place 3"],
      "estimatedCost": ${Math.floor(budget * 0.8)}
    }
  ]
}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${JSON.stringify(data)}`,
            },
          ],
        };
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

      return {
        content: [
          {
            type: "text",
            text: text,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }

  return {
    content: [
      {
        type: "text",
        text: `Unknown tool: ${name}`,
      },
    ],
  };
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gemini MCP Server running on stdio");
}

main().catch(console.error);
