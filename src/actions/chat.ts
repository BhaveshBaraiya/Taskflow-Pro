"use server";

import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import Project from "@/models/Project";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pusherServer } from "@/lib/pusher-server";

export async function getInboxData() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  await connectDB();
  const user = await User.findById(session.user.id).select("activeWorkspace").lean();
  if (!user || !user.activeWorkspace) return [];
  
  const conversations = await Conversation.find({
    workspaceId: user.activeWorkspace,
    participants: session.user.id
  })
    .populate("participants", "name email avatarUrl")
    .lean();
  
  // High-performance serialization mapping (Avoids JSON.parse block)
  return conversations.map((conv: any) => ({
    ...conv,
    _id: conv._id.toString(),
    workspaceId: conv.workspaceId?.toString(),
    participants: conv.participants.map((p: any) => ({
      ...p,
      _id: p._id.toString()
    }))
  }));
}

export async function getMessages(chatId: string, type: "project" | "dm", limit = 50) {
  const session = await auth();
  if (!session?.user?.id) return [];
  
  await connectDB();
  const user = await User.findById(session.user.id).select("activeWorkspace").lean();
  if (!user || !user.activeWorkspace) return [];

  if (type === "project") {
    const project = await Project.findOne({ _id: chatId, workspaceId: user.activeWorkspace }).select("_id").lean();
    if (!project) throw new Error("Unauthorized access to this project workspace.");
  } else {
    const conversation = await Conversation.findOne({ _id: chatId, workspaceId: user.activeWorkspace }).select("_id").lean();
    if (!conversation) throw new Error("Unauthorized access to this conversation workspace.");
  }

  const query = type === "project" ? { projectId: chatId } : { conversationId: chatId };
  
  // Added strict limit (50 messages) to perfectly feed React Virtuoso window shifts
  const messages = await Message.find(query)
    .populate("senderId", "name email avatarUrl")
    .sort({ createdAt: -1 }) // Sort latest first for instant infinity loading shifts
    .limit(limit)
    .lean();
    
  return messages.reverse().map((msg: any) => ({
    ...msg,
    _id: msg._id.toString(),
    senderId: {
      ...msg.senderId,
      _id: msg.senderId._id.toString()
    },
    workspaceId: msg.workspaceId?.toString(),
    projectId: msg.projectId?.toString(),
    conversationId: msg.conversationId?.toString(),
    createdAt: msg.createdAt.toISOString()
  }));
}

export async function sendMessage(chatId: string, type: "project" | "dm", formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const text = formData.get("text") as string;
  const attachmentsStr = formData.get("attachments") as string | null;
  
  let attachments = [];
  if (attachmentsStr) {
    attachments = JSON.parse(attachmentsStr);
  }

  if ((!text || text.trim() === "") && attachments.length === 0) return;

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("No active workspace found");

  // Verify target belongs to the active workspace before writing data
  if (type === "project") {
    const project = await Project.findOne({ _id: chatId, workspaceId: user.activeWorkspace });
    if (!project) throw new Error("Project mismatch with active workspace");
  } else {
    const conversation = await Conversation.findOne({ _id: chatId, workspaceId: user.activeWorkspace });
    if (!conversation) throw new Error("Conversation mismatch with active workspace");
  }

  const messageData: any = { 
    text, 
    senderId: session.user.id,
    workspaceId: user.activeWorkspace
  };
  
  if (type === "project") messageData.projectId = chatId;
  else messageData.conversationId = chatId;

  if (attachments.length > 0) {
    messageData.attachments = attachments;
  }
  
  const newMessage = await Message.create(messageData);
  const populatedMessage = await Message.findById(newMessage._id).populate("senderId", "name email avatarUrl");
  
  // 2. Format a strictly smaller message for Pusher
  const pusherMessage = {
    _id: populatedMessage._id.toString(),
    // Reduce substring to 1000 to safely stay under Pusher's 10KB limit
    text: populatedMessage.text ? populatedMessage.text.substring(0, 1000) : "",    
    senderId: {
      _id: populatedMessage.senderId._id.toString(),
      name: populatedMessage.senderId.name,
      email: populatedMessage.senderId.email,
      // Strip out base64 avatars if they exist, to save huge amounts of space
      avatarUrl: populatedMessage.senderId.avatarUrl?.startsWith("data:image") 
        ? null 
        : (populatedMessage.senderId.avatarUrl || null),
    },
    createdAt: populatedMessage.createdAt,
    attachments: populatedMessage.attachments?.map((attachment: any) => ({
      name: attachment.name,
      fileType: attachment.fileType,
      url: attachment.url?.startsWith("http") ? attachment.url : null
    })) || []
  };

  // 3. Wrap Pusher trigger in try/catch to prevent server action crashes
  try {
    await pusherServer.trigger(chatId, "new-message", JSON.parse(JSON.stringify(pusherMessage)));
  } catch (pusherError) {
    console.error("Failed to push message to clients (likely 413 Payload Too Large):", pusherError);
    // We don't throw here. The DB saved successfully, so we let the function continue.
  }

  let participantsToNotify: string[] = [];
  if (type === "project") {
    const project = await Project.findById(chatId).select("members ownerId");
    participantsToNotify = [...(project?.members || []), project?.ownerId].map(id => id?.toString());
  } else {
    const conversation = await Conversation.findById(chatId).select("participants");
    participantsToNotify = (conversation?.participants || []).map((id: any) => id.toString());
  }

  const senderName = populatedMessage.senderId.name;
  const notifications = participantsToNotify
    .filter(userId => userId !== session?.user?.id)
    .map(userId => 
      pusherServer.trigger(`user-${userId}`, "new-notification", {
        title: `New message from ${senderName}`,
        message: text.length > 40 ? text.substring(0, 40) + "..." : text,
        type: "message",
        link: `/dashboard/inbox?type=${type}&id=${chatId}`
      })
    );
  
  try {
    await Promise.all(notifications);
  } catch (notificationError) {
    console.error("Failed to push notification:", notificationError);
  }

  revalidatePath(`/dashboard/inbox`);
}

export async function searchUsers(query: string) {
  const session = await auth();
  if (!session?.user?.id || !query || query.length < 2) return [];

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) return [];

  const workspace = await Workspace.findById(user.activeWorkspace).select("members");
  if (!workspace) return [];

  // Escapes special characters so names like "Saif (Dev)" don't crash the search
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const users = await User.find({
    _id: { $in: workspace.members, $ne: session.user.id },
    $or: [
      { name: { $regex: safeQuery, $options: "i" } },
      { email: { $regex: safeQuery, $options: "i" } }
    ]
  }).select("name email avatarUrl jobTitle").limit(5);

  return JSON.parse(JSON.stringify(users));
}

export async function createConversation(userIds: string[], isGroup: boolean, name?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("No active workspace found");

  // Confirm target participants are actually workspace members
  const workspace = await Workspace.findById(user.activeWorkspace).select("members");
  const workspaceMemberIds = workspace?.members.map((m: any) => m.toString()) || [];
  const validParticipants = userIds.every(id => workspaceMemberIds.includes(id));
  if (!validParticipants) throw new Error("Vulnerability Blocked: Cannot message users outside your active workspace.");

  if (!isGroup && userIds.length === 1) {
    const existingConv = await Conversation.findOne({
      isGroup: false,
      workspaceId: user.activeWorkspace,
      participants: { $all: [session.user.id, userIds[0]] }
    });

    if (existingConv) {      
      redirect(`/dashboard/inbox?type=dm&id=${existingConv._id}`);
    }
  }

  const participants = [session.user.id, ...userIds];
  const newConv = await Conversation.create({
    isGroup,
    name: isGroup ? name : undefined,
    workspaceId: user.activeWorkspace,
    participants
  });

  revalidatePath("/dashboard/inbox", "layout");
  redirect(`/dashboard/inbox?type=dm&id=${newConv._id}`);
}