"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { updateTaskStatus } from "@/actions/task";
import { updateProjectColumns } from "@/actions/project";
import TaskCard from "@/components/shared/TaskCard";
import TaskDetailModal from "@/components/shared/TaskDetailModal";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function KanbanBoard({ 
  initialTasks, 
  projectId, 
  initialColumns,
  members
}: { 
  initialTasks: any[], 
  projectId: string, 
  initialColumns: any[] ,
  members: any[]
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [columns, setColumns] = useState(initialColumns);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const urlTaskId = searchParams.get("taskId");

  useEffect(() => {
    setTasks(initialTasks);
    if (urlTaskId && initialTasks.length > 0) {
      const taskToOpen = initialTasks.find(t => t._id === urlTaskId);
      if (taskToOpen) {
        setSelectedTask(taskToOpen);
      }
    }
  }, [initialTasks, urlTaskId]);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const handleCloseModal = () => {
    setSelectedTask(null);
    if (urlTaskId) {
      router.replace(pathname, { scroll: false }); 
    }
  };

  const handleTaskClick = useCallback((task: any) => {
    setSelectedTask(task);
  }, []);

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) {
      setIsAddingColumn(false);
      return;
    }
    const newColId = newColumnTitle.toLowerCase().replace(/\s+/g, '-');
    const newCol = {
      id: newColId,
      title: newColumnTitle,
      colorClass: "bg-zinc-50 border-zinc-200",
      dotClass: "bg-zinc-400"
    };
    
    const newColumns = [...columns, newCol];
    setColumns(newColumns);
    setNewColumnTitle("");
    setIsAddingColumn(false);

    try {
      await updateProjectColumns(projectId, newColumns);
    } catch (error) {
      toast.error("Failed to save new phase.");
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    const hasTasks = tasks.some(t => t.status === columnId);
    if (hasTasks) {
      toast.error("Cannot delete a phase that contains tasks. Move or delete them first.");
      return;
    }

    const newColumns = columns.filter((col) => col.id !== columnId);
    setColumns(newColumns);

    try {
      await updateProjectColumns(projectId, newColumns);
      toast.success("Phase deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete phase.");
    }
  };

  const handleTitleChange = (columnId: string, newTitle: string) => {
    setColumns(columns.map(col => col.id === columnId ? { ...col, title: newTitle } : col));
  };

  const saveColumnTitle = async () => {
    try {
      await updateProjectColumns(projectId, columns);
    } catch (error) {
      toast.error("Failed to save phase name.");
    }
  };

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === "column") {
      const newColumns = Array.from(columns);
      const [movedColumn] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, movedColumn);
      setColumns(newColumns);
      
      try {
        await updateProjectColumns(projectId, newColumns);
      } catch (error) {
        toast.error("Failed to save phase order.");
      }
      return;
    }

    const updatedTasks = tasks.map((t) => {
      if (t._id === draggableId) return { ...t, status: destination.droppableId };
      return t;
    });

    setTasks(updatedTasks);

    try {
      await updateTaskStatus(draggableId, destination.droppableId, projectId);
    } catch (error) {
      setTasks(tasks);
    }
  };

  return (
    <>
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="board" type="column" direction="horizontal">
        {(provided) => (
          <div 
            {...provided.droppableProps} 
            ref={provided.innerRef} 
            // 🔥 FIX 1: Removed `items-start`. Now all columns stretch equally to the bottom, stopping macro-jerking.
            className="flex h-full gap-6 overflow-x-auto pb-4"
          >
            {columns.map((column: any, index: number) => (
              <Draggable key={column.id} draggableId={column.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    style={{
                    ...provided.draggableProps.style,
                  } as any}
                    // 🔥 FIX 2: Added `h-full` so the column takes up the full stretched height.
                    className={`flex flex-col h-full max-h-full w-80 shrink-0 rounded-2xl border p-4 transition-colors ${column.colorClass} ${snapshot.isDragging ? "shadow-xl rotate-2 z-50" : ""}`}
                  >
                    <div 
                      {...provided.dragHandleProps}
                      className="flex items-center justify-between mb-4 cursor-grab active:cursor-grabbing group shrink-0"
                    >
                      <div className="flex items-center gap-2 flex-1 mr-2 min-w-0">
                        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${column.dotClass}`} />
                        <input 
                          value={column.title}
                          onChange={(e) => handleTitleChange(column.id, e.target.value)}
                          onBlur={saveColumnTitle}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                          className="font-extrabold text-sm text-zinc-900 uppercase tracking-wider bg-transparent border-transparent hover:bg-zinc-200/50 focus:bg-white focus:ring-2 focus:ring-zinc-900 rounded px-1.5 py-0.5 w-full transition-all outline-none truncate cursor-text"
                          title="Click to edit name"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-zinc-400 px-1">
                          {tasks.filter((t) => t.status === column.id).length}
                        </span>
                        <button 
                          onClick={() => handleDeleteColumn(column.id)}
                          onPointerDown={(e) => e.stopPropagation()} 
                          className="text-zinc-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                          title="Delete Phase"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <Droppable droppableId={column.id} type="task">
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          // 🔥 FIX 3: Replaced `space-y-3` with `flex flex-col gap-3`. This stops the micro-jerking by using native flexbox gaps instead of margins.
                          className={`flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar min-h-[150px] ${snapshot.isDraggingOver ? "bg-zinc-100/50 rounded-xl" : ""}`}
                        >
                          {tasks
                            .filter((t) => t.status === column.id)
                            .map((task, taskIndex) => (
                              <Draggable key={task._id} draggableId={task._id} index={taskIndex}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={provided.draggableProps.style as React.CSSProperties}
                                  >
                                    <TaskCard task={task} onClick={() => handleTaskClick(task)} />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            <div className="shrink-0 w-80">
              {isAddingColumn ? (
                <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-2">
                  <Input 
                    autoFocus
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    placeholder="Phase name..."
                    className="h-9 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddColumn();
                      if (e.key === "Escape") setIsAddingColumn(false);
                    }}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsAddingColumn(false)} className="h-8 text-xs font-bold text-zinc-500">Cancel</Button>
                    <Button size="sm" onClick={handleAddColumn} className="h-8 text-xs bg-zinc-900 text-white font-bold">Add Phase</Button>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={() => setIsAddingColumn(true)}
                  variant="outline" 
                  className="w-full h-12 border-dashed border-2 border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 font-bold bg-transparent"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Phase
                </Button>
              )}
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>

    <TaskDetailModal 
      task={selectedTask} 
      projectId={projectId}
      members={members}
      isOpen={!!selectedTask} 
      onClose={handleCloseModal}
      onUpdate={(data) => setTasks(tasks.map(t => t._id === selectedTask._id ? {...t, ...data} : t))}
    />
    </>
  );
}