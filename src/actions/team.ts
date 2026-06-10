"use server";

import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import Notification from "@/models/Notification";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher-server";

export async function inviteUserToProject(projectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const email = formData.get("email") as string;
  if (!email) throw new Error("Email is required.");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("Working session context error");

  const project = await Project.findOne({ _id: projectId, ownerId: session.user.id, workspaceId: user.activeWorkspace });
  if (!project) throw new Error("Only the project owner can invite members.");

  const userToInvite = await User.findOne({ email: email.toLowerCase() });
  if (!userToInvite) throw new Error("No user found with that email address.");

  if (project.members.includes(userToInvite._id)) {
    throw new Error("User is already a member of this project.");
  }
  if (userToInvite._id.toString() === session.user.id) {
    throw new Error("You cannot invite yourself.");
  }

  // 1. Add user to project channel array
  project.members.push(userToInvite._id);
  await project.save();

  // FIX: Simultaneously ensure they exist inside the parent Workspace member group 
  // so they are discoverable across matching directories and can change active states
  await Workspace.findByIdAndUpdate(project.workspaceId, { $addToSet: { members: userToInvite._id } });
  await User.findByIdAndUpdate(userToInvite._id, { $addToSet: { workspaces: project.workspaceId } });

  const notif = await Notification.create({
    recipientId: userToInvite._id,
    title: "Added to Project",
    message: `You were invited to join the project "${project.title}"`,
    link: `/dashboard/projects/${projectId}`,
    workspaceId: project.workspaceId
  });

  await pusherServer.trigger(`user-${userToInvite._id}`, "new-notification", {
    title: notif.title,
    message: notif.message,
    link: notif.link
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true, message: "User invited successfully." };
}

export async function getProjectMembers(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) return [];

  const project = await Project.findOne({ _id: projectId, workspaceId: user.activeWorkspace }).populate("members", "name email avatarUrl");
  if (!project) return [];
  
  return JSON.parse(JSON.stringify(project.members));
}

export async function getAllWorkspaceMembers(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) return [];
  
  const project = await Project.findOne({ _id: projectId, workspaceId: user.activeWorkspace });
  if (!project) return [];

  const workspace = await Workspace.findOne({ _id: project.workspaceId, members: session.user.id });
  if (!workspace) return [];

  const users = await User.find({
    _id: { $in: workspace.members }
  }).select("_id name email avatarUrl");

  return JSON.parse(JSON.stringify(users));
}

export async function toggleProjectMember(projectId: string, userId: string, action: 'add' | 'remove') {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("Missing active workspace identifier verification process metadata rules context exception");

  const project = await Project.findOne({ _id: projectId, workspaceId: user.activeWorkspace });
  if (!project) throw new Error("Unauthorized project scope access mutation processing rule block trigger");

  if (action === 'add') {
    await Project.findByIdAndUpdate(projectId, { $addToSet: { members: userId } });
    await Workspace.findByIdAndUpdate(project.workspaceId, { $addToSet: { members: userId } });
    await User.findByIdAndUpdate(userId, { $addToSet: { workspaces: project.workspaceId } });

    const notif = await Notification.create({
      recipientId: userId,
      title: "Added to Project",
      message: `You have been added to "${project.title}"`,
      link: `/dashboard/projects/${projectId}`,
      workspaceId: project.workspaceId
    });

    await pusherServer.trigger(`user-${userId}`, "new-notification", {
      title: notif.title,
      message: notif.message,
      link: notif.link
    });

  } else {
    await Project.findByIdAndUpdate(projectId, { $pull: { members: userId } });

    const notif = await Notification.create({
      recipientId: userId,
      title: "Removed from Project",
      message: `You were removed from "${project.title}"`,
      link: `/dashboard/projects`,
      workspaceId: project.workspaceId
    });

    await pusherServer.trigger(`user-${userId}`, "new-notification", {
      title: notif.title,
      message: notif.message,
      link: notif.link
    });
  }
  
  revalidatePath(`/dashboard/projects/${projectId}`);
}