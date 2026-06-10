"use server";

import { connectDB } from "@/lib/db";
import Workspace from "@/models/Workspace";
import User from "@/models/User";
import { auth } from "@/auth";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

const generateInviteCode = () => crypto.randomBytes(3).toString("hex").toUpperCase();

export async function createWorkspace(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  if (!name || name.trim() === "") throw new Error("Workspace name is required");

  await connectDB();

  const inviteCode = generateInviteCode();
  const newWorkspace = await Workspace.create({
    name,
    ownerId: session.user.id,
    members: [session.user.id],
    inviteCode,
  });

  await User.findByIdAndUpdate(session.user.id, {
    $push: { workspaces: newWorkspace._id },
    $set: { activeWorkspace: newWorkspace._id },
  });

  return { success: true };
}

export async function joinWorkspace(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const inviteCode = formData.get("inviteCode") as string;
  if (!inviteCode || inviteCode.trim() === "") throw new Error("Invite code is required");

  await connectDB();

  const workspace = await Workspace.findOne({ inviteCode: inviteCode.toUpperCase() });
  if (!workspace) throw new Error("Invalid invite code");

  if (workspace.members.includes(session.user.id)) {
    await User.findByIdAndUpdate(session.user.id, {
      $set: { activeWorkspace: workspace._id },
    });
    return { success: true };
  }

  await Workspace.findByIdAndUpdate(workspace._id, {
    $push: { members: session.user.id },
  });

  await User.findByIdAndUpdate(session.user.id, {
    $push: { workspaces: workspace._id },
    $set: { activeWorkspace: workspace._id },
  });

  return { success: true };
}

export async function getUserWorkspaces() {
  const session = await auth();
  if (!session?.user?.id) return { workspaces: [], activeWorkspace: null };

  await connectDB();
  const user = await User.findById(session.user.id).populate("workspaces", "name inviteCode");
  
  if (!user) return { workspaces: [], activeWorkspace: null };

  return JSON.parse(JSON.stringify({
    workspaces: user.workspaces,
    activeWorkspace: user.activeWorkspace
  }));
}

export async function switchActiveWorkspace(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) throw new Error("User not found");

  const isMember = user.workspaces.some(id => id.toString() === workspaceId);
  if (!isMember) {
    throw new Error("Vulnerability Blocked: You do not have access to this workspace.");
  }

  await User.findByIdAndUpdate(session.user.id, {
    $set: { activeWorkspace: workspaceId }
  });

  revalidatePath("/", "layout");
}