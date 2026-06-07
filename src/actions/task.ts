"use server";

import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Notification from "@/models/Notification";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { taskSchema } from "@/lib/validations";
import Project from "@/models/Project";
import { pusherServer } from "@/lib/pusher-server";
import { getZodErrorMessage } from "@/lib/validation-helper";

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
    throw new Error(getZodErrorMessage(validatedData.error));
  }

  await connectDB();
  const project = await Project.findById(validatedData.data.projectId).select("workspaceId title");
  if (!project) throw new Error("Project not found");

  const newTask = await Task.create({
    title: validatedData.data.title,
    description: validatedData.data.description,
    projectId: validatedData.data.projectId,
    status: validatedData.data.status,
    priority: "MEDIUM",
    assignees: validatedData.data.assignees,
    workspaceId: project.workspaceId 
  });

  if (assignees.length > 0) {
    const notifications = assignees
      .filter((id: string) => id !== session?.user?.id)
      .map((id: string) => ({
        recipientId: id,
        title: "New Task Assigned",
        message: `You were assigned to "${newTask.title}"`,
        link: `/dashboard/projects/${project._id}?taskId=${newTask._id}`,
        workspaceId: project.workspaceId
      }));

    if (notifications.length > 0) {
      const saved = await Notification.insertMany(notifications);
      await Promise.all(saved.map(n => pusherServer.trigger(`user-${n.recipientId}`, "new-notification", n)));
    }
  }
  revalidatePath(`/dashboard/projects/${validatedData.data.projectId}`);
}

export async function getTasks(projectId: string) {
  await connectDB();
  const tasks = await Task.find({ projectId }).populate("assignees", "name email avatarUrl");
  return JSON.parse(JSON.stringify(tasks));
}

export async function updateTaskDetails(taskId: string, projectId: string, data: any) {
  await connectDB();
  const updatePayload: any = { title: data.title, description: data.description, priority: data.priority };
  const unset: any = {};
  data.startDate ? (updatePayload.startDate = new Date(data.startDate)) : (unset.startDate = 1);
  data.dueDate ? (updatePayload.dueDate = new Date(data.dueDate)) : (unset.dueDate = 1);
  
  await Task.findByIdAndUpdate(taskId, { $set: updatePayload, $unset: unset });
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function updateTaskAssignees(taskId: string, projectId: string, assigneeIds: string[]) {
  await connectDB();
  
  const task = await Task.findById(taskId);
  const oldAssignees = task.assignees.map((a: any) => a.toString());
  
  const newlyAdded = assigneeIds.filter(id => !oldAssignees.includes(id));
  
  await Task.findByIdAndUpdate(taskId, { assignees: assigneeIds });

  for (const userId of newlyAdded) {
    const notif = await Notification.create({ 
      recipientId: userId, 
      title: "Task Assigned", 
      message: `You were assigned to "${task.title}"`, 
      link: `/dashboard/projects/${projectId}?taskId=${taskId}`, 
      workspaceId: task.workspaceId 
    });
    await pusherServer.trigger(`user-${userId}`, "new-notification", notif);
  }

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

export async function getMyTasks() {
  const session = await auth();
  if (!session?.user?.id) return [];

  await connectDB();
    
  const tasks = await Task.find({ assignees: session.user.id })
    .populate("projectId", "title")
    .populate("assignees", "name avatarUrl")
    .sort({ dueDate: 1, createdAt: -1 });

  return JSON.parse(JSON.stringify(tasks));
}