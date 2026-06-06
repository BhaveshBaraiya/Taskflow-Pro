"use server";

import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function inviteUserToProject(projectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const email = formData.get("email") as string;
  if (!email) throw new Error("Email is required.");

  await connectDB();

  const project = await Project.findOne({ _id: projectId, ownerId: session.user.id });
  if (!project) throw new Error("Only the project owner can invite members.");

  const userToInvite = await User.findOne({ email: email.toLowerCase() });
  if (!userToInvite) throw new Error("No user found with that email address.");

  if (project.members.includes(userToInvite._id)) {
    throw new Error("User is already a member of this project.");
  }
  if (userToInvite._id.toString() === session.user.id) {
    throw new Error("You cannot invite yourself.");
  }

  project.members.push(userToInvite._id);
  await project.save();

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true, message: "User invited successfully." };
}

export async function getProjectMembers(projectId: string) {
  await connectDB();
  const project = await Project.findById(projectId).populate("members", "name email");
  
  if (!project) return [];
  return JSON.parse(JSON.stringify(project.members));
}