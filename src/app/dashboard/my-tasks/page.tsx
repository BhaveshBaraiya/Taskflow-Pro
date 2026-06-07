import { getMyTasks } from "@/actions/task";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, CheckCircle2, Circle, Clock, AlertCircle, ArrowRight } from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";
import { format } from "date-fns";

export const metadata = {
  title: "My Tasks | TaskFlow Pro",
};

export default async function MyTasksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const tasks = await getMyTasks();

  // Separate tasks into active and completed
  const activeTasks = tasks.filter((t: any) => t.status !== "done" && t.status !== "completed");
  const completedTasks = tasks.filter((t: any) => t.status === "done" || t.status === "completed");

  const priorityColors = {
    URGENT: "text-red-700 bg-red-50 border-red-200",
    HIGH: "text-orange-700 bg-orange-50 border-orange-200",
    MEDIUM: "text-amber-700 bg-amber-50 border-amber-200",
    LOW: "text-blue-700 bg-blue-50 border-blue-200",
  };

  return (
    <div className="flex h-full flex-col max-w-5xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="shrink-0 pt-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">My Tasks</h1>
        <p className="text-sm font-medium text-zinc-500 mt-1">
          Review and manage all tasks assigned to you across all projects.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Active Tasks Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-200 pb-2">
            <Clock className="h-5 w-5 text-blue-500" /> Active Tasks
            <span className="bg-zinc-100 text-zinc-600 text-xs py-0.5 px-2 rounded-full ml-2">
              {activeTasks.length}
            </span>
          </h2>
          
          {activeTasks.length === 0 ? (
            <div className="bg-white border border-zinc-200 border-dashed rounded-xl p-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-900">You're all caught up!</h3>
              <p className="text-xs text-zinc-500 mt-1">No active tasks assigned to you right now.</p>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden divide-y divide-zinc-100">
              {activeTasks.map((task: any) => (
                <TaskRow key={task._id} task={task} priorityColors={priorityColors} />
              ))}
            </div>
          )}
        </div>

        {/* Completed Tasks Section */}
        {completedTasks.length > 0 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-200 pb-2 opacity-70">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Completed
              <span className="bg-zinc-100 text-zinc-600 text-xs py-0.5 px-2 rounded-full ml-2">
                {completedTasks.length}
              </span>
            </h2>
            
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-100 opacity-70 transition-opacity hover:opacity-100">
              {completedTasks.map((task: any) => (
                <TaskRow key={task._id} task={task} priorityColors={priorityColors} isCompleted />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for rendering a single task row
function TaskRow({ task, priorityColors, isCompleted = false }: { task: any, priorityColors: any, isCompleted?: boolean }) {
  const isOverdue = !isCompleted && task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <Link 
      href={`/dashboard/projects/${task.projectId?._id}?taskId=${task._id}`}
      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-zinc-50 transition-colors gap-4"
    >
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="mt-0.5 shrink-0">
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <Circle className="h-5 w-5 text-zinc-300 group-hover:text-blue-500 transition-colors" />
          )}
        </div>
        
        <div className="flex flex-col min-w-0 flex-1">
          <span className={`text-sm font-bold truncate ${isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-900'}`}>
            {task.title}
          </span>
          <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 font-medium">
            <span className="truncate flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              {task.projectId?.title || "Unknown Project"}
            </span>
            
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-bold' : ''}`}>
                <Calendar className="h-3 w-3" />
                {format(new Date(task.dueDate), "MMM d, yyyy")}
                {isOverdue && <AlertCircle className="h-3 w-3 ml-0.5" />}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pl-9 sm:pl-0 shrink-0">
        {/* Priority Badge */}
        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border ${priorityColors[task.priority as keyof typeof priorityColors] || "bg-zinc-100 text-zinc-600"}`}>
          {task.priority || "MEDIUM"}
        </span>

        {/* Assignees (Just a visual indicator of who else is on the task) */}
        <div className="flex -space-x-2 hidden sm:flex">
          {task.assignees?.slice(0, 3).map((assignee: any) => (
            <UserAvatar key={assignee._id} user={assignee} className="h-6 w-6 border-2 border-white" />
          ))}
          {task.assignees?.length > 3 && (
            <div className="h-6 w-6 rounded-full bg-zinc-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-zinc-600">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>

        <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-600 transition-colors hidden sm:block" />
      </div>
    </Link>
  );
}