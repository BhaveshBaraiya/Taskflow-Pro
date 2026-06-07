"use server";

import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";
import User from "@/models/User";
import { auth } from "@/auth";
import Project from "@/models/Project";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pusherServer } from "@/lib/pusher-server";

export async function getInboxData() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) return [];
  
  const conversations = await Conversation.find({
    workspaceId: user.activeWorkspace,
    participants: session.user.id
  }).populate("participants", "name email avatarUrl");
  
  return JSON.parse(JSON.stringify(conversations));
}

export async function getMessages(chatId: string, type: "project" | "dm") {
  const session = await auth();
  if (!session?.user?.id) return [];
  await connectDB();
  const query = type === "project" ? { projectId: chatId } : { conversationId: chatId };
  const messages = await Message.find(query)
    .populate("senderId", "name email avatarUrl")
    .sort({ createdAt: 1 });
  return JSON.parse(JSON.stringify(messages));
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

  await pusherServer.trigger(chatId, "new-message", JSON.parse(JSON.stringify(populatedMessage)));
  let participantsToNotify: string[] = [];
  if (type === "project") {
    const project = await Project.findById(chatId).select("members ownerId");
    participantsToNotify = [...(project?.members || []), project?.ownerId].map(id => id?.toString());
  } else {
    const conversation = await Conversation.findById(chatId).select("participants");
    participantsToNotify = (conversation?.participants || []).map((id: any) => id.toString());
  }

  // 3. Broadcast to EVERYONE'S personal channel (except the sender)
  const senderName = populatedMessage.senderId.name;
  const notifications = participantsToNotify
    .filter(userId => userId !== session.user.id) // Don't notify the person typing
    .map(userId => 
      pusherServer.trigger(`user-${userId}`, "new-notification", {
        title: `New message from ${senderName}`,
        message: text.length > 40 ? text.substring(0, 40) + "..." : text,
        type: "message",
        link: `/dashboard/inbox?type=${type}&id=${chatId}`
      })
    );

  await Promise.all(notifications);
  revalidatePath(`/dashboard/inbox`);
}

export async function searchUsers(query: string) {
  const session = await auth();
  if (!session?.user?.id) return [];
  if (!query || query.length < 2) return [];
  await connectDB();
  const users = await User.find({
    _id: { $ne: session.user.id },
    $or: [
      { name: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } }
    ]
  }).select("name email avatarUrl").limit(5);
  return JSON.parse(JSON.stringify(users));
}

export async function createConversation(userIds: string[], isGroup: boolean, name?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) throw new Error("No active workspace found");

  if (!isGroup && userIds.length === 1) {
    const existingConv = await Conversation.findOne({
      isGroup: false,
      workspaceId: user.activeWorkspace,
      participants: { $all: [session.user.id, userIds[0]] }
    });

    if (existingConv) {
      // Chat exists! Just redirect to it.
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