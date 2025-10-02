import { v4 as uuidv4 } from "uuid";
import {
  Task,
  Priority,
  Status,
  CreateTaskSchema,
  ListTasksSchema,
  UpdateTaskSchema,
  TaskIdSchema,
  SearchSchema,
} from "./types.js";
import { loadTasks, saveTasks, formatTask } from "./storage.js";

/**
 * Create a new task
 */
export async function createTask(args: unknown) {
  // Validate input
  const validated = CreateTaskSchema.parse(args);

  // Load existing tasks
  const storage = await loadTasks();

  // Create new task
  const newTask: Task = {
    id: uuidv4(),
    title: validated.title,
    description: validated.description,
    priority: validated.priority as Priority,
    category: validated.category,
    dueDate: validated.dueDate,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  // Add to storage
  storage.tasks.push(newTask);
  await saveTasks(storage);

  return {
    content: [
      {
        type: "text",
        text: `✅ Task created successfully!\n\n${formatTask(newTask)}`,
      },
    ],
  };
}

/**
 * List tasks with optional filters
 */
export async function listTasks(args: unknown) {
  // Validate input
  const validated = ListTasksSchema.parse(args || {});

  // Load tasks
  const storage = await loadTasks();
  let tasks = [...storage.tasks];

  // Apply filters
  if (validated.status !== "all") {
    tasks = tasks.filter((t) => t.status === validated.status);
  }
  if (validated.priority !== "all") {
    tasks = tasks.filter((t) => t.priority === validated.priority);
  }
  if (validated.category) {
    tasks = tasks.filter(
      (t) => t.category?.toLowerCase() === validated.category?.toLowerCase()
    );
  }

  if (tasks.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: "No tasks found matching the criteria.",
        },
      ],
    };
  }

  // Sort by priority and due date
  const priorityOrder: Record<Priority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  tasks.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    const aDate = a.dueDate || "9999-99-99";
    const bDate = b.dueDate || "9999-99-99";
    return aDate.localeCompare(bDate);
  });

  // Format output
  let result = `📋 Found ${tasks.length} task(s):\n\n`;
  tasks.forEach((task) => {
    result += formatTask(task) + "\n";
  });

  // Add summary
  const pending = storage.tasks.filter((t) => t.status === "pending").length;
  const inProgress = storage.tasks.filter(
    (t) => t.status === "in_progress"
  ).length;
  const completed = storage.tasks.filter((t) => t.status === "completed").length;

  result += `\n📊 Summary: ${pending} pending | ${inProgress} in progress | ${completed} completed`;

  return {
    content: [
      {
        type: "text",
        text: result,
      },
    ],
  };
}

/**
 * Update an existing task
 */
export async function updateTask(args: unknown) {
  // Validate input
  const validated = UpdateTaskSchema.parse(args);

  // Load tasks
  const storage = await loadTasks();

  // Find task by ID (partial match)
  const taskIndex = storage.tasks.findIndex((t) =>
    t.id.startsWith(validated.taskId)
  );

  if (taskIndex === -1) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Task with ID ${validated.taskId} not found.`,
        },
      ],
    };
  }

  const task = storage.tasks[taskIndex]!;

  // Update fields if provided
  if (validated.title !== undefined) {
    task.title = validated.title;
  }
  if (validated.description !== undefined) {
    task.description = validated.description;
  }
  if (validated.priority !== undefined) {
    task.priority = validated.priority as Priority;
  }
  if (validated.category !== undefined) {
    task.category = validated.category;
  }
  if (validated.dueDate !== undefined) {
    task.dueDate = validated.dueDate;
  }
  if (validated.status !== undefined) {
    task.status = validated.status as Status;
    if (validated.status === "completed" && !task.completedAt) {
      task.completedAt = new Date().toISOString();
    } else if (validated.status !== "completed") {
      task.completedAt = undefined;
    }
  }

  await saveTasks(storage);

  return {
    content: [
      {
        type: "text",
        text: `✅ Task updated successfully!\n\n${formatTask(task)}`,
      },
    ],
  };
}

/**
 * Delete a task
 */
export async function deleteTask(args: unknown) {
  // Validate input
  const validated = TaskIdSchema.parse(args);

  // Load tasks
  const storage = await loadTasks();

  // Find task index
  const taskIndex = storage.tasks.findIndex((t) =>
    t.id.startsWith(validated.taskId)
  );

  if (taskIndex === -1) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Task with ID ${validated.taskId} not found.`,
        },
      ],
    };
  }

  // Remove task
  const deletedTask = storage.tasks.splice(taskIndex, 1)[0]!;
  await saveTasks(storage);

  return {
    content: [
      {
        type: "text",
        text: `🗑️ Task "${deletedTask.title}" deleted successfully.`,
      },
    ],
  };
}

/**
 * Mark a task as completed
 */
export async function completeTask(args: unknown) {
  // Validate input
  const validated = TaskIdSchema.parse(args);

  // Load tasks
  const storage = await loadTasks();

  // Find task
  const task = storage.tasks.find((t) => t.id.startsWith(validated.taskId));

  if (!task) {
    return {
      content: [
        {
          type: "text",
          text: `❌ Task with ID ${validated.taskId} not found.`,
        },
      ],
    };
  }

  // Update status
  task.status = "completed";
  task.completedAt = new Date().toISOString();
  await saveTasks(storage);

  return {
    content: [
      {
        type: "text",
        text: `✅ Task completed!\n\n${formatTask(task)}`,
      },
    ],
  };
}

/**
 * Search tasks
 */
export async function searchTasks(args: unknown) {
  // Validate input
  const validated = SearchSchema.parse(args);

  // Load tasks
  const storage = await loadTasks();
  const query = validated.query.toLowerCase();

  // Search in title and description
  const matchingTasks = storage.tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query))
  );

  if (matchingTasks.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `No tasks found matching "${validated.query}".`,
        },
      ],
    };
  }

  // Format results
  let result = `🔍 Found ${matchingTasks.length} task(s) matching "${validated.query}":\n\n`;
  matchingTasks.forEach((task) => {
    result += formatTask(task) + "\n";
  });

  return {
    content: [
      {
        type: "text",
        text: result,
      },
    ],
  };
}

/**
 * Get task statistics
 */
export async function getTaskStats() {
  const storage = await loadTasks();
  const tasks = storage.tasks;

  if (tasks.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: "No tasks yet. Create your first task to get started!",
        },
      ],
    };
  }

  // Calculate statistics
  const total = tasks.length;
  const byStatus = {
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const byPriority = {
    high: tasks.filter((t) => t.priority === "high").length,
    medium: tasks.filter((t) => t.priority === "medium").length,
    low: tasks.filter((t) => t.priority === "low").length,
  };

  // Category counts
  const categories = new Map<string, number>();
  tasks.forEach((t) => {
    if (t.category) {
      categories.set(t.category, (categories.get(t.category) || 0) + 1);
    }
  });

  // Check for overdue and upcoming tasks
  const today = new Date().toISOString().split("T")[0]!;
  const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]!;

  const overdue = tasks.filter(
    (t) => t.status !== "completed" && t.dueDate && t.dueDate < today
  ).length;

  const dueSoon = tasks.filter(
    (t) =>
      t.status !== "completed" &&
      t.dueDate &&
      t.dueDate >= today &&
      t.dueDate <= oneWeekFromNow
  ).length;

  const completionRate =
    total > 0 ? ((byStatus.completed / total) * 100).toFixed(1) : "0";

  // Format output
  let result = "📊 Task Manager Statistics\n";
  result += "=".repeat(30) + "\n\n";
  result += `📈 Total Tasks: ${total}\n`;
  result += `✅ Completion Rate: ${completionRate}%\n\n`;

  result += "Status Breakdown:\n";
  result += `  📋 Pending: ${byStatus.pending}\n`;
  result += `  ⏳ In Progress: ${byStatus.in_progress}\n`;
  result += `  ✅ Completed: ${byStatus.completed}\n\n`;

  result += "Priority Breakdown:\n";
  result += `  🔴 High: ${byPriority.high}\n`;
  result += `  🟡 Medium: ${byPriority.medium}\n`;
  result += `  🟢 Low: ${byPriority.low}\n`;

  if (categories.size > 0) {
    result += "\nCategories:\n";
    Array.from(categories.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([cat, count]) => {
        result += `  📁 ${cat}: ${count}\n`;
      });
  }

  if (overdue > 0) {
    result += `\n⚠️ Overdue Tasks: ${overdue}\n`;
  }
  if (dueSoon > 0) {
    result += `📅 Due Within 7 Days: ${dueSoon}\n`;
  }

  return {
    content: [
      {
        type: "text",
        text: result,
      },
    ],
  };
}

/**
 * Clear completed tasks
 */
export async function clearCompleted() {
  const storage = await loadTasks();
  const originalCount = storage.tasks.length;

  // Filter out completed tasks
  storage.tasks = storage.tasks.filter((t) => t.status !== "completed");
  const removedCount = originalCount - storage.tasks.length;

  await saveTasks(storage);

  const message =
    removedCount > 0
      ? `🧹 Cleared ${removedCount} completed task(s). ${storage.tasks.length} active task(s) remaining.`
      : "No completed tasks to clear.";

  return {
    content: [
      {
        type: "text",
        text: message,
      },
    ],
  };
}
