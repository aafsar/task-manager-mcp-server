#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  createTask,
  listTasks,
  updateTask,
  deleteTask,
  completeTask,
  searchTasks,
  getTaskStats,
  clearCompleted,
} from "./tools.js";
import { loadTasks } from "./storage-router.js";

// Tool definitions with JSON Schema
const TOOLS = [
  {
    name: "create_task",
    description: "Create a new task",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Task title (required)",
        },
        description: {
          type: "string",
          description: "Detailed description",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high"],
          default: "medium",
          description: "Task priority",
        },
        category: {
          type: "string",
          description: "Task category (work/personal/etc)",
        },
        dueDate: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
          description: "Due date in YYYY-MM-DD format",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "list_tasks",
    description: "List tasks with optional filters",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["pending", "in_progress", "completed", "all"],
          default: "all",
          description: "Filter by status",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "all"],
          default: "all",
          description: "Filter by priority",
        },
        category: {
          type: "string",
          description: "Filter by category",
        },
      },
    },
  },
  {
    name: "update_task",
    description: "Update an existing task",
    inputSchema: {
      type: "object",
      properties: {
        taskId: {
          type: "string",
          description: "Task ID (use first 8 characters)",
          minLength: 8,
        },
        title: {
          type: "string",
          description: "New title",
        },
        description: {
          type: "string",
          description: "New description",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "New priority",
        },
        category: {
          type: "string",
          description: "New category",
        },
        dueDate: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
          description: "New due date (YYYY-MM-DD)",
        },
        status: {
          type: "string",
          enum: ["pending", "in_progress", "completed"],
          description: "New status",
        },
      },
      required: ["taskId"],
    },
  },
  {
    name: "delete_task",
    description: "Delete a task by ID",
    inputSchema: {
      type: "object",
      properties: {
        taskId: {
          type: "string",
          description: "Task ID (use first 8 characters)",
          minLength: 8,
        },
      },
      required: ["taskId"],
    },
  },
  {
    name: "complete_task",
    description: "Mark a task as completed",
    inputSchema: {
      type: "object",
      properties: {
        taskId: {
          type: "string",
          description: "Task ID (use first 8 characters)",
          minLength: 8,
        },
      },
      required: ["taskId"],
    },
  },
  {
    name: "search_tasks",
    description: "Search tasks by title or description",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query",
          minLength: 1,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_task_stats",
    description: "Get statistics about all tasks",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "clear_completed",
    description: "Remove all completed tasks",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// Create the MCP server
const server = new Server(
  {
    name: "task-manager",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "create_task":
        return await createTask(args);

      case "list_tasks":
        return await listTasks(args);

      case "update_task":
        return await updateTask(args);

      case "delete_task":
        return await deleteTask(args);

      case "complete_task":
        return await completeTask(args);

      case "search_tasks":
        return await searchTasks(args);

      case "get_task_stats":
        return await getTaskStats();

      case "clear_completed":
        return await clearCompleted();

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      // Format validation errors with proper quoting
      const formattedErrors = error.errors.map((e) => {
        let message = e.message;

        // If the error includes a received value, quote it properly
        if (e.code === "invalid_enum_value" && "received" in e) {
          const received = e.received;
          const expected = "options" in e ? e.options : [];
          message = `Invalid value '${received}'. Expected one of: ${expected.map((v: any) => `'${v}'`).join(", ")}`;
        }

        return message;
      });

      return {
        content: [
          {
            type: "text",
            text: `❌ Validation error: ${formattedErrors.join(", ")}`,
          },
        ],
      };
    }

    // Handle other errors
    return {
      content: [
        {
          type: "text",
          text: `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
    };
  }
});

// Handle prompt listing (we don't have any prompts, return empty list)
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [],
}));

// Handle resource listing
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "tasks://list",
      name: "All Tasks (JSON)",
      description: "Get all tasks in JSON format",
      mimeType: "application/json",
    },
  ],
}));

// Handle resource reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "tasks://list") {
    const storage = await loadTasks();
    return {
      contents: [
        {
          uri: "tasks://list",
          text: JSON.stringify(storage.tasks, null, 2),
          mimeType: "application/json",
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Task Manager MCP server running on stdio");
}

// Handle errors
main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
