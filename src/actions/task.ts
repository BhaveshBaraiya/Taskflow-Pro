"use server";

import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { taskSchema, updateTaskSchema } from "@/lib/validations";

export async function createTask(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const assigneesString = formData.get("assignees") as string;
  const assignees = assigneesString ? JSON.parse(assigneesString) : [];

  const rawData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    projectId: formData.get("projectId") as string,
    status: formData.get("status") as string,
    assignees: assignees
  };

  const validatedData = taskSchema.safeParse(rawData);
  if (!validatedData.success) {
    throw new Error(validatedData.error.errors[0].message);
  }

  await connectDB();

  await Task.create({
    title: validatedData.data.title,
    description: validatedData.data.description,
    projectId: validatedData.data.projectId,
    status: validatedData.data.status,
    priority: "MEDIUM",
    assignees: validatedData.data.assignees
  });

  revalidatePath(`/dashboard/projects/${validatedData.data.projectId}`);
}

export async function getTasks(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  await connectDB();
  const tasks = await Task.find({ projectId })
    .sort({ createdAt: -1 })
    .populate("assignees", "name email");
  
  return JSON.parse(JSON.stringify(tasks));
}

export async function updateTaskDetails(taskId: string, projectId: string, formData: FormData) {
  const rawData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
  };

  const validatedData = updateTaskSchema.safeParse(rawData);
  if (!validatedData.success) {
    throw new Error(validatedData.error.errors[0].message);
  }

  await connectDB();
  await Task.findByIdAndUpdate(taskId, { 
    title: validatedData.data.title, 
    description: validatedData.data.description 
  });
  
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function updateTaskStatus(taskId: string, newStatus: string, projectId: string) {
  await connectDB();
  await Task.findByIdAndUpdate(taskId, { status: newStatus });
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function deleteTask(taskId: string, projectId: string) {
  await connectDB();
  await Task.findByIdAndDelete(taskId);
  revalidatePath(`/dashboard/projects/${projectId}`);
}