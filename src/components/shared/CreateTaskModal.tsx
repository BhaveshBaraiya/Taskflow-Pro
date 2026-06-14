"use client";

import { useState } from "react";
import { createTask } from "@/actions/task";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Column = { id: string; title: string };
type Member = { _id: string; name: string; email: string };

export default function CreateTaskModal({ 
  projectId, 
  columns, 
  members 
}: { 
  projectId: string, 
  columns: Column[], 
  members: Member[] 
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const toggleAssignee = (id: string) => {
    setSelectedAssignees(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    formData.append("projectId", projectId);
    formData.append("assignees", JSON.stringify(selectedAssignees));
    
    const defaultStatus = columns.length > 0 ? columns[0].id : "todo";
    formData.append("status", defaultStatus);

    try {
      await createTask(formData);
      setOpen(false);
      setSelectedAssignees([]); 
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm transition-all active:scale-95 font-bold">
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>      
      <DialogContent className="sm:max-w-[425px] w-[95vw] border-zinc-200 bg-white p-6 shadow-xl max-h-[85dvh] overflow-y-auto flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-bold text-zinc-900">Create New Task</DialogTitle>
          <DialogDescription className="text-zinc-500 font-medium">
            Define parameters and assign team members.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-2 flex-1 overflow-y-visible">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-zinc-700 font-bold">Task Title</Label>
            <Input id="title" name="title" required className="bg-zinc-50 border-zinc-200 focus:bg-white" />
          </div>
          
          <div className="space-y-2">
            <Label className="text-zinc-700 font-bold">Assign Team Members</Label>
            <div className="border border-zinc-200 rounded-xl bg-zinc-50 p-2 space-y-1 max-h-32 overflow-y-auto">
              {members.length === 0 ? (
                <p className="text-xs text-zinc-500 p-2 text-center font-medium">No team members invited yet.</p>
              ) : (
                members.map((member) => (
                  <div 
                    key={member._id} 
                    onClick={() => toggleAssignee(member._id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedAssignees.includes(member._id) ? "bg-zinc-200 border border-zinc-300 shadow-sm" : "hover:bg-zinc-100 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-7 w-7 shadow-sm">
                        <AvatarFallback className="bg-white text-[10px] font-bold text-zinc-700 border border-zinc-200">
                          {member.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-bold text-zinc-800">{member.name}</span>
                    </div>
                    <div className={`h-4 w-4 rounded-[4px] border transition-colors ${selectedAssignees.includes(member._id) ? "bg-zinc-900 border-zinc-900" : "border-zinc-300 bg-white"}`} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-700 font-bold">Description</Label>
            <Textarea id="description" name="description" className="resize-none h-24 bg-zinc-50 border-zinc-200 focus:bg-white" />
          </div>

          <div className="flex justify-end pt-2 shrink-0">
            <Button type="submit" disabled={isPending} className="bg-zinc-900 text-white min-w-[120px] font-bold pb-safe">
              {isPending ? <Spinner className="mr-2 h-4 w-4" /> : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}