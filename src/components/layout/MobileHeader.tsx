"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X, Hexagon } from "lucide-react";
import SidebarNav from "@/components/shared/SidebarNav";
import WorkspaceSwitcher from "@/components/shared/WorkspaceSwitcher";
import UserSettings from "@/components/shared/UserSettings";
import Link from "next/link";

export default function MobileHeader({ user, workspaceData }: { user: any, workspaceData: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  return (
    <>
      <header className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 bg-white shrink-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2 font-extrabold text-zinc-900">
          <Hexagon className="h-5 w-5 fill-zinc-900" />
          TaskFlow
        </Link>
        <button onClick={() => setIsOpen(true)} className="p-2 -mr-2 text-zinc-600 hover:bg-zinc-100 rounded-lg">
          <Menu className="h-5 w-5" />
        </button>
      </header>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <aside className="relative w-72 bg-white flex flex-col h-full shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between p-4 border-b border-zinc-100">
              <span className="font-extrabold text-zinc-900">Navigation</span>
              <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 text-zinc-400 hover:bg-zinc-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
                        
            <div className="p-4 border-b border-zinc-100">          
              <WorkspaceSwitcher 
                initialWorkspaces={workspaceData?.workspaces || []} 
                initialActiveId={workspaceData?.activeWorkspace || null} 
              />
            </div>
            <div className="flex-1 overflow-y-auto py-2"><SidebarNav /></div>
            <UserSettings user={user} />
          </aside>
        </div>
      )}
    </>
  );
}