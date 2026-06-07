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

  // Add user to project
  project.members.push(userToInvite._id);
  await project.save();

  // Create Notification
  const notif = await Notification.create({
    recipientId: userToInvite._id,
    title: "Added to Project",
    message: `You were invited to join the project "${project.title}"`,
    link: `/dashboard/projects/${projectId}`,
    workspaceId: project.workspaceId
  });

  // Trigger Real-time Pusher Event
  await pusherServer.trigger(`user-${userToInvite._id}`, "new-notification", {
    title: notif.title,
    message: notif.message,
    link: notif.link
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true, message: "User invited successfully." };
}

export async function getProjectMembers(projectId: string) {
  await connectDB();
  const project = await Project.findById(projectId).populate("members", "name email avatarUrl");
  
  if (!project) return [];
  return JSON.parse(JSON.stringify(project.members));
}

// Fetches ALL registered users on the platform so you can find new users
export async function getAllWorkspaceMembers(projectId: string) {
  await connectDB();
  // Fetch every registered user in the database
  const allUsers = await User.find({}).select("_id name email avatarUrl");
  return JSON.parse(JSON.stringify(allUsers));
}

// Automatically adds/removes the user to the Workspace and sends notifications
export async function toggleProjectMember(projectId: string, userId: string, action: 'add' | 'remove') {
  await connectDB();
  const project = await Project.findById(projectId);
  if (!project) return;

  if (action === 'add') {
    // 1. Add to Project
    await Project.findByIdAndUpdate(projectId, { $addToSet: { members: userId } });
    
    // 2. Add to Workspace so they have global access
    await Workspace.findByIdAndUpdate(project.workspaceId, { $addToSet: { members: userId } });
    
    // 3. Ensure the workspace is added to the User's document
    await User.findByIdAndUpdate(userId, { $addToSet: { workspaces: project.workspaceId } });

    // 4. Send Notification
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
    // 1. Remove from project (they stay in the workspace)
    await Project.findByIdAndUpdate(projectId, { $pull: { members: userId } });

    // 2. Send Notification
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