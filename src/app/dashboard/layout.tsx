import SidebarNav from "@/components/shared/SidebarNav";
import { Hexagon } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-zinc-50 overflow-hidden text-zinc-900">
      
      {/* Persistent Left Sidebar */}
      <aside className="w-64 shrink-0 border-r border-zinc-200 bg-white hidden md:flex flex-col">
        {/* Branding */}
        <div className="flex items-center gap-2 px-6 h-16 border-b border-zinc-100 shrink-0 font-extrabold tracking-tight text-lg">
          <Hexagon className="h-6 w-6 text-zinc-900 fill-zinc-900" />
          TaskFlow Pro
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav />
        </div>
      </aside>

      {/* Main Dynamic Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
      
    </div>
  );
}