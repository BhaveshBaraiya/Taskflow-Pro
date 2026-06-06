"use client";

import { useState } from "react";
import { updateProject } from "@/actions/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit2 } from "lucide-react";

export default function EditProjectModal({ project }: { project: any }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    try {
      await updateProject(project._id, formData);
      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 hidden sm:flex">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-zinc-200 bg-white p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-zinc-900">Edit Project</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Update the parameters for this workspace.
          </DialogDescription>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-zinc-700 font-semibold">Project Title</Label>
            <Input 
              id="title" 
              name="title" 
              defaultValue={project.title}
              required 
              className="h-10 bg-zinc-50 border-zinc-200 focus:bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-700 font-semibold">Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              defaultValue={project.description}
              className="resize-none h-24 bg-zinc-50 border-zinc-200 focus:bg-white" 
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button 
              type="submit" 
              disabled={isPending}
              className="bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}