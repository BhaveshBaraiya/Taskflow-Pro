"use server";

import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Notification from "@/models/Notification";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { taskSchema } from "@/lib/validations";
import Project from "@/models/Project";
import User from "@/models/User";
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
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("Missing active workspace identifier context");

  // Verify destination target project matches user active workspace session
  const project = await Project.findOne({ _id: validatedData.data.projectId, workspaceId: user.activeWorkspace }).select("workspaceId title");
  if (!project) throw new Error("Project targeted not recognized in active tenant domain space");

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
  const session = await auth();
  if (!session?.user?.id) return [];

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) return [];

  // Locked fetch strategy to context workspace
  const tasks = await Task.find({ projectId, workspaceId: user.activeWorkspace }).populate("assignees", "name email avatarUrl");
  return JSON.parse(JSON.stringify(tasks));
}

export async function updateTaskDetails(taskId: string, projectId: string, data: any) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("Unknown operational active workspace boundary");

  const updatePayload: any = { title: data.title, description: data.description, priority: data.priority };
  const unset: any = {};
  data.startDate ? (updatePayload.startDate = new Date(data.startDate)) : (unset.startDate = 1);
  data.dueDate ? (updatePayload.dueDate = new Date(data.dueDate)) : (unset.dueDate = 1);
  
  const updateQuery: any = { $set: updatePayload };
  if (Object.keys(unset).length > 0) updateQuery.$unset = unset;

  const targetTask = await Task.findOneAndUpdate(
    { _id: taskId, workspaceId: user.activeWorkspace, projectId },
    updateQuery
  );

  if (!targetTask) throw new Error("Action payload update blocked: Task workspace or assignment mismatch");

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function updateTaskAssignees(taskId: string, projectId: string, assigneeIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("Invalid active workspace identity context tracking rule");
  
  const task = await Task.findOne({ _id: taskId, workspaceId: user.activeWorkspace, projectId });
  if (!task) throw new Error("Task requested not found in tenant segment execution frame");

  const oldAssignees = task.assignees.map((a: any) => a.toString());
  const newlyAdded = assigneeIds.filter(id => !oldAssignees.includes(id));
  
  task.assignees = assigneeIds;
  await task.save();

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
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("Missing current selected user active workspace index");

  const task = await Task.findOneAndUpdate(
    { _id: taskId, workspaceId: user.activeWorkspace, projectId },
    { status: newStatus }
  );

  if (!task) throw new Error("Task location processing configuration mismatch exception layer context error");

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function deleteTask(taskId: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("Authentication working active workspace parameter verification exception");

  const task = await Task.findOneAndDelete({ _id: taskId, workspaceId: user.activeWorkspace, projectId });
  if (!task) throw new Error("Access error executing drop database operational query command tracking sequence exception");

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function getMyTasks() {
  const session = await auth();
  if (!session?.user?.id) return [];

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) return [];
    
  // Secured: Strictly isolate custom task feeds using the user's current selected activeWorkspace state context
  const tasks = await Task.find({ 
    assignees: session.user.id,
    workspaceId: user.activeWorkspace 
  })
    .populate("projectId", "title")
    .populate("assignees", "name avatarUrl")
    .sort({ dueDate: 1, createdAt: -1 });

  return JSON.parse(JSON.stringify(tasks));
}