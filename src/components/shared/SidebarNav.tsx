"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, FolderKanban, Inbox } from "lucide-react";

export default function SidebarNav() {
  const pathname = usePathname();

  const links = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Inbox", href: "/dashboard/inbox", icon: Inbox },
    { name: "My Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Workspaces", href: "/dashboard/projects", icon: FolderKanban },
  ];

  return (
    <nav className="flex-1 space-y-1.5 p-4" aria-label="Main Navigation">
      {links.map((link) => {        
        const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
        const Icon = link.icon;

        return (
          <Link
            key={link.name}
            href={link.href}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
              isActive
                ? "bg-zinc-900 text-white shadow-sm" // High-impact active state
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" // Subtle minimalist inactive state
            }`}
          >
            <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-zinc-300" : "text-zinc-400 group-hover:text-zinc-600"}`} />
            {link.name}            
            {link.name === "Inbox" && !isActive && (
              <span className="ml-auto flex h-2 w-2 rounded-full bg-blue-600"></span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}