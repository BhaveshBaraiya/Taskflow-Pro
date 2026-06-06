"use client";

import { useState, useEffect } from "react";
import { updateTaskStatus, deleteTask, updateTaskDetails } from "@/actions/task";
import { addProjectColumn, saveProjectColumns, deleteProjectColumn } from "@/actions/project";
import { AlignLeft, MoreVertical, Trash2, Edit2, Plus, GripHorizontal, Bold, Italic, List, Link2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Task = {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
  assignees?: { _id: string, name: string, email: string }[];
};

type ColumnType = {
  id: string;
  title: string;
  colorClass: string;
  dotClass: string;
};

export default function KanbanBoard({ 
  initialTasks, 
  projectId, 
  columns = [] 
}: { 
  initialTasks: Task[], 
  projectId: string,
  columns: ColumnType[] 
}) {  
  
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [boardColumns, setBoardColumns] = useState<ColumnType[]>(columns);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    setBoardColumns(columns);
  }, [columns]);
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingColumn, setEditingColumn] = useState<ColumnType | null>(null);
  const [columnToDelete, setColumnToDelete] = useState<ColumnType | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  };
  
  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const dragType = e.dataTransfer.getData("type");

    if (dragType === "task") {
      const taskId = e.dataTransfer.getData("taskId");
      if (!taskId) return;
      
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: targetId } : t)));
      try {
        await updateTaskStatus(taskId, targetId, projectId);
      } catch (error) {
        console.error(error);      
      }
    } 
    else if (dragType === "column") {
      const sourceColumnId = e.dataTransfer.getData("columnId");
      if (!sourceColumnId || sourceColumnId === targetId) return;

      const newCols = [...boardColumns];
      const sourceIdx = newCols.findIndex(c => c.id === sourceColumnId);
      const targetIdx = newCols.findIndex(c => c.id === targetId);
      
      const [movedCol] = newCols.splice(sourceIdx, 1);
      newCols.splice(targetIdx, 0, movedCol);
      
      setBoardColumns(newCols); 
      try {
        await saveProjectColumns(projectId, newCols); 
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleAddColumnSubmit = async (formData: FormData) => {
    setIsAddingColumn(true);
    const title = formData.get("title") as string;
    const newId = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const newCol: ColumnType = {
      id: newId,
      title,
      colorClass: "bg-zinc-50 border-zinc-200",
      dotClass: "bg-zinc-900"
    };
    setBoardColumns((prev) => [...prev, newCol]);

    try {
      await addProjectColumn(projectId, formData);
      (document.getElementById("add-column-form") as HTMLFormElement)?.reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsAddingColumn(false);
    }
  };

  const handleEditColumnSubmit = async (formData: FormData) => {
    if (!editingColumn) return;
    setIsSaving(true);
    const newTitle = formData.get("title") as string;
    
    const newCols = boardColumns.map(c => c.id === editingColumn.id ? { ...c, title: newTitle } : c);
    setBoardColumns(newCols);
    
    try {
      await saveProjectColumns(projectId, newCols);
      setEditingColumn(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteColumn = async () => {
    if (!columnToDelete) return;
    
    const remainingCols = boardColumns.filter(c => c.id !== columnToDelete.id);
    setBoardColumns(remainingCols);
    setTasks(prev => prev.filter(t => t.status !== columnToDelete.id)); 
    
    try {
      await deleteProjectColumn(projectId, columnToDelete.id, remainingCols);
    } catch (error) {
      console.error(error);
    } finally {
      setColumnToDelete(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    try { await deleteTask(taskId, projectId); } catch (error) { console.error(error); }
  };

  const handleEditTaskSubmit = async (formData: FormData) => {
    if (!selectedTask) return;
    setIsSaving(true);
    try {
      await updateTaskDetails(selectedTask._id, projectId, formData);
      setTasks((prev) => prev.map((t) => 
        t._id === selectedTask._id ? { ...t, title: formData.get("title") as string, description: formData.get("description") as string } : t
      ));
      setSelectedTask(null);
    } catch (error) { console.error(error); } finally { setIsSaving(false); }
  };
  
  const TaskCard = ({ task }: { task: Task }) => (
    <div 
      draggable
      onDragStart={(e) => {
        e.stopPropagation(); 
        e.dataTransfer.setData("type", "task");
        e.dataTransfer.setData("taskId", task._id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => setSelectedTask(task)}
      className="group relative flex cursor-pointer flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-900 hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-bold text-zinc-900 leading-snug">{task.title}</h4>
        
        <DropdownMenu>
          <DropdownMenuTrigger 
            onClick={(e) => e.stopPropagation()} 
            className="focus:outline-none rounded-md p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors shrink-0 -mr-2 -mt-2"
          >
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-white border-zinc-200 shadow-xl rounded-xl">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }} className="focus:bg-zinc-100 cursor-pointer flex items-center gap-2 text-zinc-700 font-medium">
              <Edit2 className="h-4 w-4" /> Open Task
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }} className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer flex items-center gap-2 font-medium">
              <Trash2 className="h-4 w-4" /> Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && (
        <p className="line-clamp-2 text-xs text-zinc-500 mt-2 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${
            task.priority === "HIGH" ? "bg-red-50 text-red-700 ring-1 ring-red-600/20" : 
            task.priority === "MEDIUM" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20" : 
            "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
          }`}>
            <div className={`h-1.5 w-1.5 rounded-full ${
              task.priority === "HIGH" ? "bg-red-600" : 
              task.priority === "MEDIUM" ? "bg-amber-600" : 
              "bg-blue-600"
            }`} />
            {task.priority}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex -space-x-2">
              {task.assignees.map((assignee) => (
                <Avatar key={assignee._id} className="h-7 w-7 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-zinc-900 text-[10px] font-bold text-white">
                    {assignee.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  const Column = ({ col }: { col: ColumnType }) => {
    const columnTasks = tasks.filter((t) => t.status === col.id);
    return (
      <div 
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData("type", "column");
          e.dataTransfer.setData("columnId", col.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, col.id)}
        className={`flex w-[340px] shrink-0 cursor-grab active:cursor-grabbing flex-col gap-4 rounded-2xl p-4 border transition-colors bg-zinc-50/50 border-zinc-200/60 max-h-full`}
      >
        <div className="flex items-center justify-between group px-1">
          <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2 tracking-tight">
            <GripHorizontal className="h-4 w-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className={`h-2.5 w-2.5 rounded-sm ${col.dotClass || "bg-zinc-900"}`} />
            {col.title}
            <span className="ml-1.5 text-xs font-semibold text-zinc-500 bg-white px-2 py-0.5 rounded-md border border-zinc-200 shadow-sm">
              {columnTasks.length}
            </span>
          </h3>

          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none rounded-md p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-white transition-colors">
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-white border-zinc-200 shadow-xl rounded-xl">
              <DropdownMenuItem onClick={() => setEditingColumn(col)} className="focus:bg-zinc-100 cursor-pointer flex items-center gap-2 text-zinc-700 font-medium">
                <Edit2 className="h-4 w-4" /> Edit Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setColumnToDelete(col)} className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer flex items-center gap-2 font-medium">
                <Trash2 className="h-4 w-4" /> Delete Phase
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto pr-1 pb-1 min-h-[150px] cursor-default">
           {columnTasks.length === 0 ? (
             <div className="text-sm font-medium text-zinc-400 text-center mt-2 border-2 border-dashed border-zinc-200/80 rounded-xl py-10 bg-white/50">
               Drop tasks here
             </div>
           ) : (
             columnTasks.map((task) => <TaskCard key={task._id} task={task} />)
           )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex h-full gap-6 min-w-max items-start">
        {boardColumns.map((col) => <Column key={col.id} col={col} />)}
        
        <div className="flex w-[340px] flex-col gap-4 rounded-2xl border-2 border-dashed border-zinc-200 bg-transparent p-4 shrink-0 transition-colors hover:border-zinc-300 hover:bg-zinc-50/50">
          <form id="add-column-form" action={handleAddColumnSubmit} className="flex flex-col gap-4 px-1">
            <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2 tracking-tight">
              <Plus className="h-4 w-4 text-zinc-500" /> Add Workflow Phase
            </h3>
            <Input name="title" placeholder="e.g., QA Testing" required className="h-10 bg-white border-zinc-200 focus:border-zinc-400 font-medium shadow-sm" />
            <Button type="submit" disabled={isAddingColumn} variant="outline" className="w-full h-10 bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-100 shadow-sm font-bold">
              {isAddingColumn ? <Spinner className="h-4 w-4 text-zinc-900" /> : "Create Phase"}
            </Button>
          </form>
        </div>
      </div>
            
      {/* DETAILED TASK VIEW MODAL WITH RTE */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="sm:max-w-[750px] border-zinc-200 bg-white p-0 shadow-2xl overflow-hidden flex flex-col h-[85vh]">
          <DialogTitle className="sr-only">Task Details</DialogTitle>
          <form action={handleEditTaskSubmit} className="flex flex-col h-full">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-zinc-900" />
                {boardColumns.find(c => c.id === selectedTask?.status)?.title || "Task"}
              </span>
              <Button type="submit" disabled={isSaving} className="bg-zinc-900 text-white hover:bg-zinc-800 font-bold h-8 px-4 rounded-full">
                {isSaving ? <Spinner className="h-3 w-3 mr-2" /> : null}
                {isSaving ? "Saving..." : "Save Details"}
              </Button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
              
              {/* Giant Editable Title */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Task Title</Label>
                <Input 
                  name="title" 
                  defaultValue={selectedTask?.title} 
                  required 
                  className="text-3xl font-extrabold text-zinc-900 border-none shadow-none focus-visible:ring-0 px-0 h-auto placeholder:text-zinc-300 rounded-none bg-transparent" 
                />
              </div>

              {/* RTE Description Editor */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Description & Notes</Label>
                <div className="border border-zinc-200 rounded-xl overflow-hidden focus-within:border-zinc-400 focus-within:ring-1 focus-within:ring-zinc-400 transition-all bg-white shadow-sm">
                  
                  {/* Fake RTE Toolbar */}
                  <div className="flex items-center gap-1 bg-zinc-50 border-b border-zinc-200 p-1.5">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:bg-zinc-200"><Bold className="h-4 w-4"/></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:bg-zinc-200"><Italic className="h-4 w-4"/></Button>
                    <div className="w-[1px] h-4 bg-zinc-300 mx-1" />
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:bg-zinc-200"><List className="h-4 w-4"/></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:bg-zinc-200"><Link2 className="h-4 w-4"/></Button>
                  </div>

                  <Textarea 
                    name="description" 
                    defaultValue={selectedTask?.description} 
                    placeholder="Add detailed notes, acceptance criteria, or context..."
                    className="min-h-[250px] border-none shadow-none focus-visible:ring-0 rounded-none resize-none p-5 text-base text-zinc-700 leading-relaxed bg-white" 
                  />
                </div>
              </div>
            </div>
            
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!editingColumn} onOpenChange={(open) => !open && setEditingColumn(null)}>
        <DialogContent className="sm:max-w-[425px] border-zinc-200 bg-white p-6 shadow-xl">
          <DialogTitle className="font-bold">Rename Phase</DialogTitle>
          <form action={handleEditColumnSubmit} className="space-y-5 mt-2">
            <div className="space-y-2"><Label className="font-bold text-zinc-700">Phase Title</Label><Input name="title" defaultValue={editingColumn?.title} required className="bg-zinc-50 focus:bg-white" /></div>
            <div className="flex justify-end"><Button type="submit" disabled={isSaving} className="bg-zinc-900 text-white min-w-[120px] font-bold">{isSaving ? "Saving..." : "Save Changes"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!columnToDelete} onOpenChange={(open) => !open && setColumnToDelete(null)}>
        <AlertDialogContent className="bg-white border-zinc-200 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">Delete "{columnToDelete?.title}" phase?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600">
              This will permanently delete this phase <strong className="text-zinc-900">and all tasks inside it.</strong> This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-100 hover:bg-zinc-200 border-none font-bold text-zinc-900">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteColumn} className="bg-red-600 text-white hover:bg-red-700 font-bold">Delete everything</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}