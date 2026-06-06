import { z } from "zod";

// --- PROJECT SCHEMAS ---
export const projectSchema = z.object({
  title: z.string().min(3, "Project title must be at least 3 characters.").max(60, "Title is too long."),
  description: z.string().max(500, "Description cannot exceed 500 characters.").optional(),
});

export const projectColumnSchema = z.object({
  title: z.string().min(2, "Phase name must be at least 2 characters.").max(30, "Phase name is too long."),
});

// --- TASK SCHEMAS ---
export const taskSchema = z.object({
  title: z.string().min(3, "Task title must be at least 3 characters.").max(100, "Title is too long."),
  description: z.string().max(2000, "Description is too long.").optional(),
  status: z.string().min(1, "Status is required."),
  projectId: z.string().min(1, "Project ID is required."),
  assignees: z.array(z.string()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3, "Task title must be at least 3 characters.").max(100, "Title is too long."),
  description: z.string().max(2000, "Description is too long.").optional(),
});

// --- TEAM SCHEMAS ---
export const inviteSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
});

// Auth
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required.")
});