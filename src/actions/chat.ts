"use server";

import { connectDB } from "@/lib/db";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";
import User from "@/models/User";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pusherServer } from "@/lib/pusher-server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function getInboxData() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  await connectDB();
  
  const conversations = await Conversation.find({
    participants: session.user.id
  }).populate("participants", "name email");

  return JSON.parse(JSON.stringify(conversations));
}

export async function getMessages(chatId: string, type: "project" | "dm") {
  const session = await auth();
  if (!session?.user?.id) return [];

  await connectDB();

  const query = type === "project" ? { projectId: chatId } : { conversationId: chatId };

  const messages = await Message.find(query)
    .populate("senderId", "name email")
    .sort({ createdAt: 1 });

  return JSON.parse(JSON.stringify(messages));
}

export async function sendMessage(chatId: string, type: "project" | "dm", formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const text = formData.get("text") as string;
  const file = formData.get("file") as File | null;

  // Prevent sending completely empty messages
  if ((!text || text.trim() === "") && (!file || file.size === 0)) return;

  await connectDB();

  let attachmentUrl = undefined;
  let attachmentType = undefined;

  // Handle File Upload Logic
  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a safe, unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_"); 
    const filename = `${uniqueSuffix}-${originalName}`;

    // Ensure the public/uploads directory exists
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Write the file to the disk
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Generate the public URL
    attachmentUrl = `/uploads/${filename}`;
    attachmentType = file.type;
  }

  const messageData: any = { text, senderId: session.user.id };
  if (type === "project") messageData.projectId = chatId;
  else messageData.conversationId = chatId;

  if (attachmentUrl) {
    messageData.attachmentUrl = attachmentUrl;
    messageData.attachmentType = attachmentType;
  }

  const newMessage = await Message.create(messageData);

  const populatedMessage = await Message.findById(newMessage._id).populate("senderId", "name email");
  await pusherServer.trigger(chatId, "new-message", JSON.parse(JSON.stringify(populatedMessage)));

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
  }).select("name email").limit(5);

  return JSON.parse(JSON.stringify(users));
}

export async function createConversation(userIds: string[], isGroup: boolean, groupName?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();

  const participants = [session.user.id, ...userIds];
  
  if (!isGroup && participants.length === 2) {
    const existingConv = await Conversation.findOne({
      isGroup: false,
      participants: { $all: participants, $size: 2 }
    });

    if (existingConv) {
      redirect(`/dashboard/inbox?type=dm&id=${existingConv._id}`);
    }
  }

  const newConv = await Conversation.create({
    isGroup,
    name: isGroup ? groupName : undefined,
    participants,
  });

  revalidatePath("/dashboard/inbox");
  redirect(`/dashboard/inbox?type=dm&id=${newConv._id}`);
}