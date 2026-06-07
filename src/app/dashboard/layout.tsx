import SidebarNav from "@/components/shared/SidebarNav";
import WorkspaceSwitcher from "@/components/shared/WorkspaceSwitcher";
import GlobalNotificationListener from "@/components/shared/GlobalNotificationListener";
import UserSettings from "@/components/shared/UserSettings";
import MobileHeader from "@/components/layout/MobileHeader";
import { Hexagon } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { Toaster } from "@/components/ui/sonner";
import RealtimeNotifications from "@/components/shared/RealtimeNotifications";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const dbUser = await User.findById(session.user.id);
  if (!dbUser || !dbUser.activeWorkspace) redirect("/onboarding");
  
  const serializedUser = {
    _id: dbUser._id.toString(),
    name: dbUser.name,
    email: dbUser.email,
    avatarUrl: dbUser.avatarUrl || "",
    jobTitle: dbUser.jobTitle || "",
    settings: JSON.parse(JSON.stringify(dbUser.settings || {})),
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-zinc-50 overflow-hidden text-zinc-900 relative">
      {session?.user?.id && <GlobalNotificationListener currentUserId={session.user.id} />}
      <Toaster position="top-right" richColors />

      <MobileHeader user={serializedUser} />

      <aside className="w-64 shrink-0 border-r border-zinc-200 bg-white hidden md:flex flex-col">
        <div className="flex items-center gap-2 px-6 h-16 border-b border-zinc-100 shrink-0 font-extrabold tracking-tight text-lg">
          <Hexagon className="h-6 w-6 text-zinc-900 fill-zinc-900" />
          TaskFlow Pro
        </div>
        <div className="p-4 border-b border-zinc-100">
          <WorkspaceSwitcher />
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav />
        </div>
        <UserSettings user={serializedUser} />
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">         
          <RealtimeNotifications userId={session.user.id} />
          {children}
        </div>
      </main>
    </div>
  );
}