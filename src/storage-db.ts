import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { Task, TaskStorage, Priority } from "./types.js";

// Get current directory (ESM compatibility)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration - environment-aware
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "tasks.db");

// Initialize database
const db = new Database(DB_FILE);

// Create tasks table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high')),
    category TEXT,
    dueDate TEXT,
    status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed')),
    createdAt TEXT NOT NULL,
    completedAt TEXT
  )
`);

// Create index for faster queries
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_priority ON tasks(priority);
  CREATE INDEX IF NOT EXISTS idx_category ON tasks(category);
`);

/**
 * Load all tasks from database
 */
export async function loadTasks(): Promise<TaskStorage> {
  const stmt = db.prepare("SELECT * FROM tasks");
  const rows = stmt.all() as Task[];

  return {
    tasks: rows,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Save a single task to database (insert or update)
 */
export async function saveTask(task: Task): Promise<void> {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO tasks (
      id, title, description, priority, category, dueDate, status, createdAt, completedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    task.id,
    task.title,
    task.description || null,
    task.priority,
    task.category || null,
    task.dueDate || null,
    task.status,
    task.createdAt,
    task.completedAt || null
  );
}

/**
 * Save multiple tasks (used for compatibility with file storage)
 */
export async function saveTasks(storage: TaskStorage): Promise<void> {
  const transaction = db.transaction((tasks: Task[]) => {
    for (const task of tasks) {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO tasks (
          id, title, description, priority, category, dueDate, status, createdAt, completedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        task.id,
        task.title,
        task.description || null,
        task.priority,
        task.category || null,
        task.dueDate || null,
        task.status,
        task.createdAt,
        task.completedAt || null
      );
    }
  });

  transaction(storage.tasks);
}

/**
 * Delete a task from database
 */
export async function deleteTask(taskId: string): Promise<boolean> {
  const stmt = db.prepare("DELETE FROM tasks WHERE id = ?");
  const result = stmt.run(taskId);
  return result.changes > 0;
}

/**
 * Format a task for display (same as file storage)
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

/**
 * Close database connection (for graceful shutdown)
 */
export function closeDatabase(): void {
  db.close();
}
