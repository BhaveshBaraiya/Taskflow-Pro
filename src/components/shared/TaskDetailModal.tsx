"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Flag, AlignLeft, Trash2, X, Plus } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { updateTaskDetails, deleteTask, updateTaskAssignees } from "@/actions/task";
import UserAvatar from "@/components/shared/UserAvatar";
import { Checkbox } from "@/components/ui/checkbox";

const priorityConfig = {
  URGENT: { color: "text-red-700 bg-red-50 border-red-200", label: "Urgent" },
  HIGH: { color: "text-orange-700 bg-orange-50 border-orange-200", label: "High" },
  MEDIUM: { color: "text-amber-700 bg-amber-50 border-amber-200", label: "Medium" },
  LOW: { color: "text-blue-700 bg-blue-50 border-blue-200", label: "Low" },
};

export default function TaskDetailModal({ 
  task, 
  projectId, 
  members,
  isOpen, 
  onClose,
  onUpdate 
}: { 
  task: any, 
  projectId: string, 
  members: any[],
  isOpen: boolean, 
  onClose: () => void,
  onUpdate: (updatedData: any) => void
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("LOW");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit, 
      Placeholder.configure({ placeholder: "Add a detailed description..." })
    ],
    editorProps: { 
      attributes: { class: "prose prose-sm max-w-none focus:outline-none min-h-[150px] text-zinc-700" } 
    },
  });

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || "");
      setPriority(task.priority || "LOW");
      setStartDate(task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : "");
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
      
      if (editor) {
        editor.commands.setContent(task.description || "");
      }
    }
  }, [task, isOpen, editor]);

  const handleToggleAssignee = async (memberId: string) => {
    const isAssigned = task.assignees.some((a: any) => a._id === memberId);
    const newAssignees = isAssigned 
      ? task.assignees.filter((a: any) => a._id !== memberId)
      : [...task.assignees, { _id: memberId }];
    
    await updateTaskAssignees(task._id, projectId, newAssignees.map((a: any) => a._id));
    onUpdate({ ...task, assignees: newAssignees });
  };

  const handleDelete = async () => {
    await deleteTask(task._id, projectId);
    onClose();
  };

  const handleSave = async () => {
    if (!task) return;
    setIsSaving(true);
    
    const updatedData = {
      title,
      description: editor?.getHTML() || "",
      priority,
      startDate: startDate || null,
      dueDate: dueDate || null,
    };
    
    try {
      onUpdate(updatedData);
      await updateTaskDetails(task._id, projectId, updatedData);
      onClose();
    } catch (error) {
      console.error("Failed to save task:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[750px] w-[95vw] bg-white p-0 overflow-hidden shadow-2xl border-zinc-200 rounded-2xl">
        
        <DialogHeader className="sr-only">
          <DialogTitle>Task Details</DialogTitle>
          <DialogDescription>Edit task information</DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-6 border-b border-zinc-100 flex flex-col gap-5">
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task Title..."
            className="text-xl sm:text-2xl font-extrabold text-zinc-900 border-none px-0 shadow-none focus-visible:ring-0"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flag className="h-3 w-3" /> Priority
              </label>
              <select 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
                className={`text-sm font-bold px-3 py-2 rounded-lg border outline-none cursor-pointer w-full sm:w-auto transition-colors ${priorityConfig[priority as keyof typeof priorityConfig]?.color || "bg-zinc-50 border-zinc-200"}`}
              >
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Start Date
              </label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm font-medium border border-zinc-200 rounded-lg px-3 py-2 text-zinc-700 outline-none w-full sm:w-auto bg-zinc-50" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Due Date
              </label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="text-sm font-medium border border-zinc-200 rounded-lg px-3 py-2 text-zinc-700 outline-none w-full sm:w-auto bg-zinc-50" />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Manage Assignees</label>
              <Button size="sm" variant="outline" onClick={() => setShowMemberPicker(!showMemberPicker)} className="h-7 text-xs font-bold">
                <Plus className="h-3 w-3 mr-1" /> Add Assignee
              </Button>
            </div>
            
            {showMemberPicker && (
              <div className="border border-zinc-200 rounded-lg p-2 max-h-[150px] overflow-y-auto bg-white shadow-lg animate-in fade-in">
                {members.map((member: any) => {
                  const isAssigned = task.assignees?.some((a: any) => a._id === member._id);
                  return (
                    <div key={member._id} className="flex items-center gap-2 p-2 hover:bg-zinc-50 rounded cursor-pointer" onClick={() => handleToggleAssignee(member._id)}>
                      <Checkbox checked={isAssigned} />
                      <UserAvatar user={member} className="h-6 w-6" /> <span className="text-sm font-medium text-zinc-700">{member.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-3">
              {task.assignees.map((member: any) => (
                <div key={member._id} className="relative group">
                  <div className="transition-all duration-200 rounded-full border-2 border-emerald-500 p-0.5">
                    <UserAvatar user={member} className="h-9 w-9" />
                  </div>
                  <button 
                    onClick={() => handleToggleAssignee(member._id)} 
                    className="absolute -top-1 -right-1 bg-white border border-zinc-200 rounded-full p-0.5 opacity-0 group-hover:opacity-100 shadow-sm transition"
                    title="Remove Assignee"
                  >
                    <X className="h-3 w-3 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
            
            <p className="text-[10px] text-zinc-400 italic">
              {task.assignees?.length > 0 
                ? `Currently assigned to ${task.assignees.length} team member(s)` 
                : "No team members assigned yet"}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-zinc-50/50 flex-1 overflow-y-auto max-h-[30vh]">
          <div className="flex items-center gap-2 mb-3 text-zinc-800 font-bold text-sm uppercase tracking-wider">
            <AlignLeft className="h-4 w-4" /> Description
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm focus-within:ring-2 focus-within:ring-zinc-100 transition-all">
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="p-4 border-t border-zinc-100 bg-white flex justify-between gap-2 shrink-0">
          <Button variant="ghost" onClick={handleDelete} className="text-red-600 font-bold hover:bg-red-50 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-2" /> Delete Task
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} className="font-bold">Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-zinc-900 text-white font-bold hover:bg-zinc-800 w-full sm:w-auto shadow-sm">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}