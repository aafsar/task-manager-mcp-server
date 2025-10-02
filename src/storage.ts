import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { Task, TaskStorage, Priority } from "./types.js";

// Get current directory (ESM compatibility)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Storage configuration - environment-aware
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const TASKS_FILE = path.join(DATA_DIR, "tasks.json");

// Ensure data directory exists
fs.ensureDirSync(DATA_DIR);

/**
 * Load tasks from JSON file
 */
export async function loadTasks(): Promise<TaskStorage> {
  try {
    if (await fs.pathExists(TASKS_FILE)) {
      const data = await fs.readJson(TASKS_FILE);
      return data as TaskStorage;
    }
  } catch (error) {
    console.error("Error loading tasks:", error);
  }

  // Return empty storage if file doesn't exist or error occurs
  return {
    tasks: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Save tasks to JSON file
 */
export async function saveTasks(storage: TaskStorage): Promise<void> {
  storage.lastUpdated = new Date().toISOString();
  await fs.writeJson(TASKS_FILE, storage, { spaces: 2 });
}

/**
 * Format a task for display
 */
export function formatTask(task: Task): string {
  const statusEmoji =
    task.status === "completed"
      ? "✅"
      : task.status === "in_progress"
        ? "⏳"
        : "📋";

  const priorityEmoji: Record<Priority, string> = {
    high: "🔴",
    medium: "🟡",
    low: "🟢",
  };

  let result = `${statusEmoji} Task #${task.id.substring(0, 8)}: ${task.title}\n`;
  result += `   ${priorityEmoji[task.priority]} Priority: ${task.priority}\n`;

  if (task.description) {
    result += `   Description: ${task.description}\n`;
  }
  if (task.category) {
    result += `   Category: ${task.category}\n`;
  }
  if (task.dueDate) {
    result += `   Due: ${task.dueDate}\n`;
  }

  result += `   Status: ${task.status}\n`;
  result += `   Created: ${new Date(task.createdAt).toLocaleString()}\n`;

  if (task.completedAt) {
    result += `   Completed: ${new Date(task.completedAt).toLocaleString()}\n`;
  }

  return result;
}
