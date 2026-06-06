import { getProjects } from "@/actions/project";
import { getInboxData, getMessages } from "@/actions/chat";
import ProjectChat from "@/components/shared/ProjectChat";
import { auth } from "@/auth";
import Link from "next/link";
import { MessageSquare, Hash, Users, Plus, CircleUser, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import CreateChatModal from "@/components/shared/CreateChatModal";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: "project" | "dm", id?: string }>;
}) {
  const session = await auth();
  const currentUserId = session?.user?.id;
  
  const resolvedParams = await searchParams;
  const activeType = resolvedParams.type || "project";
  
  // Fetch left-sidebar data
  const [projects, conversations] = await Promise.all([
    getProjects(),
    getInboxData()
  ]);
  
  const activeId = resolvedParams.id || (projects.length > 0 ? projects[0]._id : null);

  // Fetch active chat messages
  let messages = [];
  let activeTitle = "";
  let isGroup = false;

  if (activeId) {
    messages = await getMessages(activeId, activeType);
    
    if (activeType === "project") {
      activeTitle = projects.find((p: any) => p._id === activeId)?.title || "Project Channel";
      isGroup = true;
    } else {
      const conv = conversations.find((c: any) => c._id === activeId);
      if (conv) {
        if (conv.isGroup) {
          activeTitle = conv.name;
          isGroup = true;
        } else {
          // Find the other person in the DM
          const otherUser = conv.participants.find((p: any) => p._id !== currentUserId);
          activeTitle = otherUser?.name || "Unknown User";
        }
      }
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] border border-zinc-200 bg-white rounded-2xl shadow-sm overflow-hidden">
      
      {/* LEFT SIDEBAR: CHAT NAVIGATION */}
      <div className="w-72 border-r border-zinc-200 bg-zinc-50/50 flex flex-col shrink-0">
        
        {/* Search & Header */}
        <div className="p-4 border-b border-zinc-100 shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-lg text-zinc-900 tracking-tight">Messages</h2>
            <CreateChatModal />
        </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input placeholder="Search chats..." className="pl-9 h-9 bg-white border-zinc-200 text-xs shadow-sm" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
          
          {/* Workspaces / Channels */}
          <div className="space-y-1">
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
              Project Channels
            </h3>
            {projects.map((project: any) => {
              const isActive = activeType === "project" && activeId === project._id;
              return (
                <Link 
                  key={project._id} 
                  href={`/dashboard/inbox?type=project&id=${project._id}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive ? "bg-blue-50 text-blue-700" : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900"
                  }`}
                >
                  <Hash className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-600" : "text-zinc-400"}`} />
                  <span className="truncate">{project.title}</span>
                </Link>
              );
            })}
          </div>

          {/* Direct Messages & Groups */}
          <div className="space-y-1">
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
              Direct Messages
            </h3>
            {conversations.length === 0 ? (
              <p className="text-xs text-zinc-500 font-medium px-3 italic">No recent messages</p>
            ) : (
              conversations.map((conv: any) => {
                const isActive = activeType === "dm" && activeId === conv._id;
                const otherUser = conv.participants.find((p: any) => p._id !== currentUserId);
                const title = conv.isGroup ? conv.name : otherUser?.name;
                const Icon = conv.isGroup ? Users : CircleUser;
                
                return (
                  <Link 
                    key={conv._id} 
                    href={`/dashboard/inbox?type=dm&id=${conv._id}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive ? "bg-blue-50 text-blue-700" : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-600" : "text-zinc-400"}`} />
                    <span className="truncate">{title}</span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: ACTIVE CHAT */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 bg-zinc-50/30">
            <MessageSquare className="h-12 w-12 mb-4 text-zinc-300" />
            <h3 className="text-lg font-bold text-zinc-900">Your Messages</h3>
            <p className="text-sm font-medium">Select a channel or conversation to start chatting.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full relative">
            {/* Dynamic Chat Component injection */}
            <ProjectChat 
              chatId={activeId} 
              chatType={activeType}
              chatTitle={activeTitle}
              isGroup={isGroup}
              initialMessages={messages} 
              currentUserId={currentUserId}
            />
          </div>
        )}
      </div>

    </div>
  );
}