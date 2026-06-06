"use server";

import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import Task from "@/models/Task";
import { redirect } from "next/navigation";
import { projectSchema, projectColumnSchema } from "@/lib/validations";

export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const rawData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
  };

  const validatedData = projectSchema.safeParse(rawData);
  if (!validatedData.success) {
    throw new Error(validatedData.error.errors[0].message);
  }

  await connectDB();

  await Project.create({
    title: validatedData.data.title,
    description: validatedData.data.description,
    ownerId: session.user.id,
  });

  revalidatePath("/dashboard/projects");
}

export async function getProjects() {
  const session = await auth();
  if (!session?.user?.id) return [];

  await connectDB();
  
  const projects = await Project.find({
    $or: [
      { ownerId: session.user.id },
      { members: session.user.id }
    ]
  }).sort({ createdAt: -1 });

  return JSON.parse(JSON.stringify(projects));
}

export async function getProjectById(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  await connectDB();

  const project = await Project.findOne({ 
    _id: projectId,
    ownerId: session.user.id
  });

  if (!project) return null;

  return JSON.parse(JSON.stringify(project));
}

export async function deleteProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const project = await Project.findOneAndDelete({ _id: projectId, ownerId: session.user.id });
  
  if (project) {    
    await Task.deleteMany({ projectId: projectId });
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
    throw new Error(validatedData.error.errors[0].message);
  }

  await connectDB();

  await Project.findOneAndUpdate(
    { _id: projectId, ownerId: session.user.id },
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
  
  if (!validatedData.success) {
    throw new Error(validatedData.error.errors[0].message);
  }

  const title = validatedData.data.title;
  const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-');

  await connectDB();

  await Project.findOneAndUpdate(
    { _id: projectId, ownerId: session.user.id },
    { 
      $push: { 
        columns: {
          id,
          title,
          colorClass: "bg-purple-50/50 border-purple-200/50",
          dotClass: "bg-purple-500"
        } 
      } 
    }
  );

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function saveProjectColumns(projectId: string, columns: any[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  await Project.findOneAndUpdate(
    { _id: projectId, ownerId: session.user.id },
    { columns }
  );

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function deleteProjectColumn(projectId: string, columnId: string, remainingColumns: any[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  
  await Project.findOneAndUpdate(
    { _id: projectId, ownerId: session.user.id },
    { columns: remainingColumns }
  );

  await Task.deleteMany({ projectId, status: columnId });

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function addProjectTab(projectId: string, title: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const id = "tab-" + Date.now().toString();

  await connectDB();
  await Project.findOneAndUpdate(
    { _id: projectId, ownerId: session.user.id },
    { 
      $push: { 
        tabs: { id, title, type: "doc", content: "" } 
      } 
    }
  );

  revalidatePath(`/dashboard/projects/${projectId}`);
  return id;
}

export async function saveProjectTabs(projectId: string, tabs: any[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  await Project.findOneAndUpdate(
    { _id: projectId, ownerId: session.user.id },
    { tabs }
  );

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function deleteProjectTab(projectId: string, tabId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  await Project.findOneAndUpdate(
    { _id: projectId, ownerId: session.user.id },
    { $pull: { tabs: { id: tabId } } }
  );

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function saveTabContent(projectId: string, tabId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  await Project.findOneAndUpdate(
    { _id: projectId, ownerId: session.user.id, "tabs.id": tabId },
    { $set: { "tabs.$.content": content } }
  );

  revalidatePath(`/dashboard/projects/${projectId}`);
}