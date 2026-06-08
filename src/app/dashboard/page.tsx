import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { Briefcase, CheckCircle2, Users, Activity, Plus } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  
  await connectDB();
  const dbUser = await User.findById(session?.user?.id).select("name");
  
  const firstName = dbUser?.name?.split(" ")[0] || "User";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 font-sans">
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <p className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-500 uppercase mb-2">
            Workspace Overview
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
            {greeting}, {firstName}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-base max-w-xl">
            Here is a summary of your active systems and pending tasks for today.
          </p>
        </div>
        
        <div className="flex-shrink-0">
          <Link 
            href="/dashboard/projects" 
            className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-2.5 rounded-full font-bold text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </div>
      </header>
            
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">        
        <div className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-default">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400">Active Projects</h3>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <p className="text-4xl font-black text-zinc-900 dark:text-white">0</p>
          <div className="mt-4 flex items-center text-xs font-bold text-zinc-400">
            <span className="text-zinc-300 dark:text-zinc-600 mr-2">—</span>
            Awaiting new phases
          </div>
        </div>
        
        <div className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-default">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400">Tasks Pending</h3>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="text-4xl font-black text-zinc-900 dark:text-white">0</p>
          <div className="mt-4 flex items-center text-xs font-bold text-zinc-400">
            <span className="text-zinc-300 dark:text-zinc-600 mr-2">—</span>
            Everything is up to date
          </div>
        </div>
        
        <div className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-default">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400">Team Members</h3>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-4xl font-black text-zinc-900 dark:text-white">1</p>
          <div className="mt-4 flex items-center text-xs font-bold text-zinc-500">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
            Workspace Admin
          </div>
        </div>
      </div>
      
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Recent Activity</h2>
        </div>
                
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800/60 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="h-12 w-12 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4 shadow-sm">
            <Activity className="h-5 w-5 text-zinc-400" />
          </div>
          <h3 className="text-zinc-900 dark:text-white font-bold mb-1">No recent activity</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
            When you or your team members create projects, move tasks, or update statuses, they will appear here.
          </p>
        </div>
      </div>
      
    </div>
  );
}