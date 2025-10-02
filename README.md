# Task Manager MCP Server

A production-ready Task Manager server built with the Model Context Protocol (MCP), enabling AI assistants to manage tasks through a standardized interface. Built with TypeScript, Zod validation, and the official MCP SDK.

## Features

- ✅ **8 Comprehensive Tools**: Create, list, update, delete, complete, search tasks, get statistics, and clear completed tasks
- 🔐 **Type-Safe**: Built with TypeScript and runtime validation using Zod
- 📦 **Portable**: Uses only official MCP SDK - no vendor lock-in
- 🐳 **Dockerized**: Ready for containerized deployment
- 💾 **Persistent Storage**: File-based JSON storage with environment-aware configuration
- 🔍 **Advanced Filtering**: Filter tasks by status, priority, and category
- 📊 **Statistics & Analytics**: Track task completion rates, overdue items, and more
- 🎯 **Production Ready**: Comprehensive error handling and validation

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/aafsar/task-manager-mcp-server.git
cd task-manager-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run the server
npm start
```

### Development Mode

```bash
# Run with hot reload
npm run dev
```

## Available Tools

### 1. `create_task`
Create a new task with optional metadata.

**Parameters:**
- `title` (string, required): Task title
- `description` (string, optional): Detailed description
- `priority` (enum, optional): "low", "medium", or "high" (default: "medium")
- `category` (string, optional): Task category (e.g., "work", "personal")
- `dueDate` (string, optional): Due date in YYYY-MM-DD format

**Example:**
```json
{
  "title": "Review pull requests",
  "description": "Review open PRs for the API project",
  "priority": "high",
  "category": "work",
  "dueDate": "2025-10-05"
}
```

### 2. `list_tasks`
List tasks with optional filters.

**Parameters:**
- `status` (enum, optional): "pending", "in_progress", "completed", or "all" (default: "all")
- `priority` (enum, optional): "low", "medium", "high", or "all" (default: "all")
- `category` (string, optional): Filter by specific category

**Example:**
```json
{
  "status": "pending",
  "priority": "high"
}
```

### 3. `update_task`
Update any field of an existing task.

**Parameters:**
- `taskId` (string, required): Task ID (minimum 8 characters)
- `title` (string, optional): New title
- `description` (string, optional): New description
- `priority` (enum, optional): New priority
- `category` (string, optional): New category
- `dueDate` (string, optional): New due date
- `status` (enum, optional): New status

**Example:**
```json
{
  "taskId": "a1b2c3d4",
  "status": "in_progress",
  "priority": "high"
}
```

### 4. `complete_task`
Mark a task as completed.

**Parameters:**
- `taskId` (string, required): Task ID (minimum 8 characters)

### 5. `delete_task`
Delete a task permanently.

**Parameters:**
- `taskId` (string, required): Task ID (minimum 8 characters)

### 6. `search_tasks`
Search tasks by title or description.

**Parameters:**
- `query` (string, required): Search query

**Example:**
```json
{
  "query": "review"
}
```

### 7. `get_task_stats`
Get comprehensive statistics about all tasks.

Returns:
- Total task count
- Completion rate
- Status breakdown (pending/in progress/completed)
- Priority breakdown (high/medium/low)
- Category distribution
- Overdue task count
- Tasks due within 7 days

### 8. `clear_completed`
Remove all completed tasks from storage.

## Claude Desktop Integration

### Configuration

1. Locate your Claude Desktop config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the server configuration:

```json
{
  "mcpServers": {
    "task-manager": {
      "command": "node",
      "args": [
        "/absolute/path/to/task-manager-mcp-server/dist/index.js"
      ]
    }
  }
}
```

3. Restart Claude Desktop completely

4. Look for the hammer icon (🔨) in the input box

5. Test with: "Create a high priority task called 'Test MCP Integration'"

## Testing with MCP Inspector

The MCP Inspector provides a web-based interface for testing tools:

```bash
# Launch the inspector
npx @modelcontextprotocol/inspector dist/index.js
```

This will open a browser window where you can:
- View all available tools
- Test tool execution interactively
- Inspect request/response data
- Debug errors

## Docker Deployment

### Build and Run with Docker

```bash
# Build the image
docker build -t task-manager-mcp .

# Run the container
docker run -it task-manager-mcp
```

### Using Docker Compose

```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### Persist Data with Docker

Data is automatically persisted to a Docker volume. To back up your tasks:

```bash
# Export tasks
docker cp task-manager-mcp:/app/data/tasks.json ./backup-tasks.json

# Import tasks
docker cp ./backup-tasks.json task-manager-mcp:/app/data/tasks.json
```

## Environment Variables

Configure the server using environment variables:

```bash
# Data storage directory (default: ./data)
DATA_DIR=/custom/path/to/data

# Log level
LOG_LEVEL=info

# Node environment
NODE_ENV=production
```

Create a `.env` file in the project root:

```bash
cp .env.example .env
# Edit .env with your values
```

## Cloud Deployment Options

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Render

1. Connect your GitHub repository
2. Create a new Web Service
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Deploy

### Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Launch app
flyctl launch

# Deploy
flyctl deploy
```

## Project Structure

```
task-manager-mcp-server/
├── src/
│   ├── index.ts       # Main MCP server and request handlers
│   ├── types.ts       # TypeScript interfaces and Zod schemas
│   ├── storage.ts     # File-based storage module
│   └── tools.ts       # Tool implementation functions
├── dist/              # Compiled JavaScript (generated)
├── data/              # Task storage (JSON files, git-ignored)
├── Dockerfile         # Docker configuration
├── docker-compose.yml # Docker Compose setup
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
└── README.md          # This file
```

## Development

### Scripts

```bash
npm run build      # Compile TypeScript to JavaScript
npm run dev        # Development mode with hot reload
npm run typecheck  # Type check without building
npm run clean      # Remove build artifacts
npm start          # Run production build
```

### Type Safety

The project uses strict TypeScript settings and Zod for runtime validation:

- **Compile-time safety**: TypeScript catches type errors during development
- **Runtime validation**: Zod validates all tool inputs at runtime
- **Dual schema approach**: JSON Schema for MCP protocol, Zod for validation

### Adding New Tools

1. Define Zod schema in `src/types.ts`
2. Implement handler function in `src/tools.ts`
3. Add tool definition to `TOOLS` array in `src/index.ts`
4. Add case handler in `tools/call` switch statement
5. Rebuild and test with MCP Inspector

## Troubleshooting

### "Cannot find module" errors

Ensure all imports use `.js` extension (even for `.ts` files):

```typescript
import { Task } from "./types.js";  // ✅ Correct
import { Task } from "./types";     // ❌ Wrong
```

### Tasks not persisting

1. Check `DATA_DIR` environment variable
2. Verify write permissions on data directory
3. Check for errors in server logs

### TypeScript compilation errors

```bash
# Run type checker to identify issues
npm run typecheck

# Common fix: ensure strict types are used
# Check tsconfig.json module settings
```

### MCP Inspector not connecting

1. Ensure server builds successfully: `npm run build`
2. Check Node.js version (must be 18+)
3. Verify no port conflicts
4. Check firewall settings

### Claude Desktop not showing tools

1. Verify JSON syntax in config file
2. Use absolute paths in configuration
3. Restart Claude Desktop completely (Cmd+R / Ctrl+R not sufficient)
4. Check server logs for errors

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP SDK GitHub](https://github.com/modelcontextprotocol/sdk)
- [Claude Desktop](https://claude.ai/download)
- [Zod Documentation](https://zod.dev/)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions:
- GitHub Issues: https://github.com/aafsar/task-manager-mcp-server/issues
- MCP Discord: https://discord.gg/modelcontextprotocol
