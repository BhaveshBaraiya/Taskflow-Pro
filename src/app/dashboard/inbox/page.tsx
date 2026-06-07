import { getProjects } from "@/actions/project";
import { getInboxData, getMessages } from "@/actions/chat";
import ProjectChat from "@/components/shared/ProjectChat";
import { auth } from "@/auth";
import Link from "next/link";
import { MessageSquare, Hash, Users, CircleUser, ArrowLeft } from "lucide-react";
import CreateChatModal from "@/components/shared/CreateChatModal";
import SidebarSearch from "@/components/shared/SidebarSearch";
import UserAvatar from "@/components/shared/UserAvatar";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: "project" | "dm", id?: string }>;
}) {
  const session = await auth();
  const currentUserId = session?.user?.id;
  
  const resolvedParams = await searchParams;
  const activeType = resolvedParams.type || "project";
  
  const [projects, conversations] = await Promise.all([
    getProjects(),
    getInboxData()
  ]);
  
  const activeId = resolvedParams.id || null;

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
          const otherUser = conv.participants.find((p: any) => p._id !== currentUserId);
          activeTitle = otherUser?.name || "Unknown User";
        }
      }
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] w-full border border-zinc-200 bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className={`shrink-0 border-r border-zinc-200 bg-zinc-50/50 flex flex-col w-72 lg:w-80 xl:w-96 ${activeId ? 'hidden md:flex' : 'flex w-full'}`}>
        <div className="p-4 border-b border-zinc-100 shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-lg text-zinc-900 tracking-tight">Messages</h2>
            <CreateChatModal />
          </div>
          <SidebarSearch />
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
          <div className="space-y-1">
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3 mb-2">Project Channels</h3>
            {projects.map((project: any) => {
              const isActive = activeType === "project" && activeId === project._id;
              return (
                <Link key={project._id} href={`/dashboard/inbox?type=project&id=${project._id}`} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${isActive ? "bg-blue-50 text-blue-700" : "text-zinc-600 hover:bg-zinc-100/80"}`}>
                  <Hash className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1 min-w-0">{project.title}</span>
                </Link>
              );
            })}
          </div>

          <div className="space-y-1">
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3 mb-2">Direct Messages</h3>
            {conversations.map((conv: any) => {
              const isActive = activeType === "dm" && activeId === conv._id;
              const otherUser = conv.participants.find((p: any) => p._id !== currentUserId);
              return (
                <Link key={conv._id} href={`/dashboard/inbox?type=dm&id=${conv._id}`} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${isActive ? "bg-blue-50 text-blue-700" : "text-zinc-600 hover:bg-zinc-100/80"}`}>
                  <UserAvatar user={{ name: conv.isGroup ? conv.name : otherUser?.name, avatarUrl: otherUser?.avatarUrl }} className="h-6 w-6 shrink-0" />
                  <span className="truncate">{conv.isGroup ? conv.name : otherUser?.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`flex-1 flex flex-col bg-white min-w-0 ${!activeId ? 'hidden md:flex' : 'flex'}`}>
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center bg-zinc-50/30 p-8">
            <div className="flex flex-col items-center justify-center text-center max-w-sm">
              <MessageSquare className="h-16 w-16 mb-6 text-zinc-200" />
              <h3 className="text-xl font-extrabold text-zinc-900 mb-2">Your Messages</h3>
              <p className="text-sm font-medium text-zinc-500">Select a project channel or a direct message from the sidebar to start collaborating.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full relative">
            <div className="md:hidden border-b border-zinc-100 bg-white p-3">
              <Link href="/dashboard/inbox" className="flex items-center gap-2 text-sm font-bold text-zinc-600"><ArrowLeft className="h-4 w-4" /> Back</Link>
            </div>
            <ProjectChat key={activeId} chatId={activeId} chatType={activeType} chatTitle={activeTitle} isGroup={isGroup} initialMessages={messages} currentUserId={currentUserId} />
          </div>
        )}
      </div>
    </div>
  );
}