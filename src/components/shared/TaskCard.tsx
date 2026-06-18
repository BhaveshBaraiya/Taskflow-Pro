"use client";

// ADDED: Import React for memoization
import React from "react"; 
import { AlignLeft, Calendar } from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";

const priorityStyles = {
  URGENT: "bg-red-50 border-red-200 hover:border-red-300",
  HIGH: "bg-orange-50 border-orange-200 hover:border-orange-300",
  MEDIUM: "bg-amber-50 border-amber-200 hover:border-amber-300",
  LOW: "bg-blue-50 border-blue-200 hover:border-blue-300",
};

// MOVED OUTSIDE: So this regex function isn't recreated on every render
const stripHtml = (html: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, '').trim();
};

function TaskCardComponent({ task, onClick }: { task: any, onClick: () => void }) {
  const pStyle = priorityStyles[task.priority as keyof typeof priorityStyles] || "bg-white border-zinc-200 hover:border-zinc-300";
  const plainDescription = stripHtml(task.description);

  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border shadow-sm transition-all group cursor-pointer flex flex-col gap-3 relative ${pStyle}`}
    >
      <h4 className="text-sm font-bold text-zinc-900 leading-snug break-words">
        {task.title}
      </h4>

      {plainDescription && plainDescription !== "" && (
        <div className="flex items-start gap-1.5 text-zinc-500">
          <AlignLeft className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <p className="text-xs font-medium line-clamp-2">{plainDescription}</p>
        </div>
      )}

      <div className="flex items-center justify-between mt-1 pt-3 border-t border-black/5">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
            {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No Due Date'}
          </span>
        </div>

        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center -space-x-2">
            {task.assignees.slice(0, 3).map((assignee: any, i: number) => (
              <div key={assignee._id || i} className="rounded-full border-2 border-white/50 shadow-sm overflow-hidden bg-white">
                <UserAvatar 
                  user={{ name: assignee.name, avatarUrl: assignee.avatarUrl }} 
                  className="h-6 w-6"
                />
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-zinc-100 border-2 border-white/50 flex items-center justify-center text-[9px] font-bold text-zinc-600 shadow-sm z-10">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// THE MAGIC: Wrap the component in React.memo
// Also provide a custom comparison function. Since we are passing an `onClick` 
// function from a parent that might recreate on every render, we tell React 
// to ONLY care if the `task._id` or `task.updatedAt` changes.
export default React.memo(TaskCardComponent, (prevProps, nextProps) => {
  return prevProps.task._id === nextProps.task._id && 
         prevProps.task.status === nextProps.task.status &&
         prevProps.task.title === nextProps.task.title;
});