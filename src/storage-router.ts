/**
 * Storage Router - Switches between file and database storage
 *
 * Set STORAGE_TYPE environment variable:
 * - "file" (default) - Uses JSON file storage
 * - "database" or "db" - Uses SQLite database
 */

import type { TaskStorage } from "./types.js";

// Determine storage type from environment
const STORAGE_TYPE = (process.env.STORAGE_TYPE || "file").toLowerCase();

// Import the appropriate storage module
let storageModule: any;

if (STORAGE_TYPE === "database" || STORAGE_TYPE === "db") {
  console.error("Using SQLite database storage");
  storageModule = await import("./storage-db.js");
} else {
  console.error("Using JSON file storage");
  storageModule = await import("./storage.js");
}

// Export unified interface
export const loadTasks: () => Promise<TaskStorage> = storageModule.loadTasks;
export const saveTasks: (storage: TaskStorage) => Promise<void> =
  storageModule.saveTasks;
export const formatTask: (task: any) => string = storageModule.formatTask;

// Optional: database-specific exports (won't exist for file storage)
export const saveTask = storageModule.saveTask || undefined;
export const deleteTask = storageModule.deleteTask || undefined;
export const closeDatabase = storageModule.closeDatabase || undefined;
