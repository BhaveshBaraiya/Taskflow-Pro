"use client";

import { useState } from "react";
import { createProject } from "@/actions/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function CreateProjectModal() {
  
  const [open, setOpen] = useState(false);
  
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    try {
      await createProject(formData);
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
        <Button className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm transition-all active:scale-95">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-zinc-200 bg-white p-6 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-zinc-900">Initialize Project</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Define the parameters for your new workspace.
          </DialogDescription>
        </DialogHeader>
        
        {/* We pass our custom handleSubmit wrapper to the form action */}
        <form action={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-zinc-700 font-semibold">Project Title</Label>
            <Input 
              id="title" 
              name="title" 
              placeholder="e.g., Q3 Marketing Site" 
              required 
              className="h-10 bg-zinc-50 border-zinc-200 focus:bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-700 font-semibold">Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              placeholder="Briefly describe the objective..." 
              className="resize-none h-24 bg-zinc-50 border-zinc-200 focus:bg-white" 
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button  type="submit"  disabled={isPending}
              className="bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-90 min-w-[120px] transition-all"
            >
              {isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 text-zinc-400" />
                  Initializing...
                </>
              ) : (
                "Initialize"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}