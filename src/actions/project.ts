"use server";

import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import Task from "@/models/Task";
import { redirect } from "next/navigation";
import { projectSchema, projectColumnSchema } from "@/lib/validations";
import User from "@/models/User";
import { getZodErrorMessage } from "@/lib/validation-helper";

export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("No active workspace configuration found");
  
  const rawData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
  };

  const validatedData = projectSchema.safeParse(rawData);
  if (!validatedData.success) {
    throw new Error(getZodErrorMessage(validatedData.error));
  }

  await Project.create({
    title: validatedData.data.title,
    description: validatedData.data.description,
    workspaceId: user.activeWorkspace,
    ownerId: session.user.id,
  });

  revalidatePath("/dashboard/projects");
}

export async function getProjects() {
  const session = await auth();
  if (!session?.user?.id) return [];

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) return [];
  
  const projects = await Project.find({ workspaceId: user.activeWorkspace }).sort({ createdAt: -1 });
  return JSON.parse(JSON.stringify(projects));
}

export async function getProjectById(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) return null;

  const project = await Project.findOne({ 
    _id: projectId,
    workspaceId: user.activeWorkspace
  });

  if (!project) return null;
  return JSON.parse(JSON.stringify(project));
}

export async function deleteProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("No active workspace context found");

  const project = await Project.findOneAndDelete({ 
    _id: projectId, 
    ownerId: session.user.id,
    workspaceId: user.activeWorkspace 
  });
  
  if (project) {    
    await Task.deleteMany({ projectId: projectId, workspaceId: user.activeWorkspace });
  }

  revalidatePath("/dashboard/projects");
  redirect("/dashboard/projects");
}

export async function updateProject(projectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const rawData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
  };

  const validatedData = projectSchema.safeParse(rawData);
  if (!validatedData.success) {
    throw new Error(getZodErrorMessage(validatedData.error));
  }

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("Active workspace verification required");

  // Update MongoDB record
  await Project.findOneAndUpdate(
    { _id: projectId, ownerId: session.user.id, workspaceId: user.activeWorkspace },
    { title: validatedData.data.title, description: validatedData.data.description }
  );

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function addProjectColumn(projectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const rawData = { title: formData.get("title") as string };
  const validatedData = projectColumnSchema.safeParse(rawData);
  if (!validatedData.success) throw new Error(getZodErrorMessage(validatedData.error));

  const title = validatedData.data.title;
  const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-');

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("Workspace context mismatch");

  await Project.findOneAndUpdate(
    { _id: projectId, workspaceId: user.activeWorkspace },
    { $push: { columns: { id, title, colorClass: "bg-purple-50/50 border-purple-200/50", dotClass: "bg-purple-500" } } }
  );

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function saveProjectColumns(projectId: string, columns: any[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("Workspace validation failed");

  await Project.findOneAndUpdate(
    { _id: projectId, workspaceId: user.activeWorkspace },
    { columns }
  );

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function deleteProjectColumn(projectId: string, columnId: string, remainingColumns: any[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("Missing active workspace parameter");
  
  await Project.findOneAndUpdate(
    { _id: projectId, workspaceId: user.activeWorkspace },
    { columns: remainingColumns }
  );

  await Task.deleteMany({ projectId, status: columnId, workspaceId: user.activeWorkspace });

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function addProjectTab(projectId: string, title: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const id = "tab-" + Date.now().toString();

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("No workspace bound context");

  await Project.findOneAndUpdate(
    { _id: projectId, workspaceId: user.activeWorkspace },
    { $push: { tabs: { id, title, type: "doc", content: "" } } }
  );

  revalidatePath(`/dashboard/projects/${projectId}`);
  return id;
}

export async function saveProjectTabs(projectId: string, tabs: any[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("Invalid operational workspace");

  await Project.findOneAndUpdate(
    { _id: projectId, workspaceId: user.activeWorkspace },
    { tabs }
  );

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function deleteProjectTab(projectId: string, tabId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("Workspace tracking verification failed");

  await Project.findOneAndUpdate(
    { _id: projectId, workspaceId: user.activeWorkspace },
    { $pull: { tabs: { id: tabId } } }
  );

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function saveTabContent(projectId: string, tabId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("Active workspace state mismatch");

  await Project.findOneAndUpdate(
    { _id: projectId, workspaceId: user.activeWorkspace, "tabs.id": tabId },
    { $set: { "tabs.$.content": content } }
  );

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function saveProjectDocs(projectId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("Missing workspace active state");
    
  // Secured: Replaced blind findByIdAndUpdate with strict multi-tenant criteria check
  const project = await Project.findOneAndUpdate(
    { _id: projectId, workspaceId: user.activeWorkspace },
    { $set: { docs: content } }
  );

  if (!project) throw new Error("Project access unauthorized within this workspace layer");

  return { success: true };
}

export async function updateProjectColumns(projectId: string, columns: any[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("User working context unknown");

  // Secured: Isolated mutations within tenant context rules
  const project = await Project.findOneAndUpdate(
    { _id: projectId, workspaceId: user.activeWorkspace },
    { $set: { columns } },
    { new: true }
  );

  if (!project) {
    throw new Error("Project metadata access tracking failure");
  }

  return JSON.parse(JSON.stringify(project));
}