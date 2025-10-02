import { z } from "zod";

// Task priority levels
export type Priority = "low" | "medium" | "high";

// Task status
export type Status = "pending" | "in_progress" | "completed";

// Main task interface
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  category?: string;
  dueDate?: string; // ISO date string YYYY-MM-DD
  status: Status;
  createdAt: string; // ISO timestamp
  completedAt?: string; // ISO timestamp
}

// Storage structure
export interface TaskStorage {
  tasks: Task[];
  lastUpdated: string;
}

// Tool argument schemas using Zod
export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  category: z.string().optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
});

export const ListTasksSchema = z.object({
  status: z
    .enum(["pending", "in_progress", "completed", "all"])
    .default("all"),
  priority: z.enum(["low", "medium", "high", "all"]).default("all"),
  category: z.string().optional(),
});

export const UpdateTaskSchema = z.object({
  taskId: z.string().min(8, "Task ID must be at least 8 characters"),
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  category: z.string().optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
});

export const TaskIdSchema = z.object({
  taskId: z.string().min(8, "Task ID must be at least 8 characters"),
});

export const SearchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
});
