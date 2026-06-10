import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher-server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Conversation from "@/models/Conversation";
import Project from "@/models/Project";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const data = await req.formData();
  const socketId = data.get("socket_id") as string;
  const channelName = data.get("channel_name") as string;

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.activeWorkspace) {
    return new Response("Forbidden", { status: 403 });
  }

  if (channelName.startsWith("private-user-")) {
    const targetUserId = channelName.split("private-user-")[1];
    if (targetUserId !== session.user.id) {
      return new Response("Forbidden context resource mapping", { status: 403 });
    }
  }

  if (channelName.startsWith("private-chat-")) {
    const chatId = channelName.split("private-chat-")[1];
    
    const isProjectChat = await Project.findOne({ _id: chatId, workspaceId: user.activeWorkspace });
    const isConvChat = await Conversation.findOne({ _id: chatId, workspaceId: user.activeWorkspace });
    
    if (!isProjectChat && !isConvChat) {
      return new Response("Unauthorized workspace access matrix", { status: 403 });
    }
  }

  const authResponse = pusherServer.authorizeChannel(socketId, channelName);
  return new Response(JSON.stringify(authResponse));
}