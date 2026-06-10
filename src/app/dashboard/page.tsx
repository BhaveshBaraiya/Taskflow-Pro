import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import Project from "@/models/Project";
import Task from "@/models/Task";
import { Briefcase, CheckCircle2, Users, Activity, Plus, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import UserAvatar from "@/components/shared/UserAvatar";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  await connectDB();
  
  // 1. Fetch the user to get their active workspace
  const dbUser = await User.findById(session.user.id).select("name activeWorkspace");
  if (!dbUser || !dbUser.activeWorkspace) return null;
  
  const firstName = dbUser.name?.split(" ")[0] || "User";

  // 2. Fetch all dashboard metrics in parallel for maximum speed
  const [
    activeProjectsCount,
    pendingTasksCount,
    workspace,
    recentTasks
  ] = await Promise.all([
    Project.countDocuments({ workspaceId: dbUser.activeWorkspace }),
    Task.countDocuments({ 
      workspaceId: dbUser.activeWorkspace, 
      assignees: session.user.id, 
      status: { $ne: "done" } 
    }),
    Workspace.findById(dbUser.activeWorkspace).select("members name"),
    // Fetch the 5 most recently updated tasks for the activity feed
    Task.find({ workspaceId: dbUser.activeWorkspace })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate("projectId", "title")
      .populate("assignees", "name avatarUrl")
      .lean()
  ]);

  const teamMembersCount = workspace?.members?.length || 1;
  const workspaceName = workspace?.name || "Your Workspace";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 font-sans animate-in fade-in duration-300">
      
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <p className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-2 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            {workspaceName} Overview
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900">
            {greeting}, {firstName}
          </h1>
          <p className="text-zinc-500 mt-2 text-sm sm:text-base max-w-xl">
            Here is a summary of your active systems and pending tasks for today.
          </p>
        </div>
        
        <div className="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
          <Link 
            href="/dashboard/projects" 
            className="w-full sm:w-auto flex justify-center items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-zinc-800 transition-all shadow-sm active:scale-95"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </div>
      </header>
            
      {/* --- DYNAMIC METRICS GRID --- */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">        
        <div className="group rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all cursor-default">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-500">Active Projects</h3>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <p className="text-4xl font-black text-zinc-900">{activeProjectsCount}</p>
          <div className="mt-4 flex items-center text-xs font-bold text-zinc-400">
            <span className="text-zinc-300 mr-2">—</span>
            Across {workspaceName}
          </div>
        </div>
        
        <div className="group rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all cursor-default">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-500">My Pending Tasks</h3>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="text-4xl font-black text-zinc-900">{pendingTasksCount}</p>
          <div className="mt-4 flex items-center text-xs font-bold text-zinc-400">
            <span className="text-zinc-300 mr-2">—</span>
            {pendingTasksCount === 0 ? "Everything is up to date" : "Awaiting your action"}
          </div>
        </div>
        
        <div className="group rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all cursor-default">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-500">Team Members</h3>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-4xl font-black text-zinc-900">{teamMembersCount}</p>
          <div className="mt-4 flex items-center text-xs font-bold text-zinc-500">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
            Workspace Roster
          </div>
        </div>
      </div>
      
      {/* --- DYNAMIC RECENT ACTIVITY FEED --- */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-bold text-zinc-900">Recent Workspace Activity</h2>
        </div>
                
        {recentTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center border-2 border-dashed border-zinc-100 rounded-xl bg-zinc-50/50">
            <div className="h-12 w-12 rounded-full bg-white border border-zinc-200 flex items-center justify-center mb-4 shadow-sm">
              <Activity className="h-5 w-5 text-zinc-400" />
            </div>
            <h3 className="text-zinc-900 font-bold mb-1">No recent activity</h3>
            <p className="text-sm text-zinc-500 max-w-sm px-4">
              When you or your team members create projects, move tasks, or update statuses, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTasks.map((task: any) => {
              const isDone = task.status === "done" || task.status === "completed";
              return (
                <Link 
                  key={task._id} 
                  href={`/dashboard/projects/${task.projectId?._id}?taskId=${task._id}`}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 transition-all gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center border ${isDone ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${isDone ? 'text-zinc-500 line-through' : 'text-zinc-900'}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          {task.projectId?.title || "Unknown Project"}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-zinc-300"></span>
                        <span className="text-xs font-medium text-zinc-500">
                          Updated {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-12 sm:pl-0">
                    <div className="flex -space-x-2">
                      {task.assignees?.slice(0, 3).map((assignee: any) => (
                        <UserAvatar key={assignee._id} user={assignee} className="h-6 w-6 border-2 border-white" />
                      ))}
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-600 transition-transform group-hover:translate-x-1 hidden sm:block" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      
    </div>
  );
}