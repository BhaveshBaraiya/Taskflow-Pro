"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation"; // <-- NEW IMPORTS
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { updateTaskStatus } from "@/actions/task";
import TaskCard from "@/components/shared/TaskCard";
import TaskDetailModal from "@/components/shared/TaskDetailModal";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    // If the URL has a taskId, auto-open that task
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
    // Remove the ?taskId= from the URL so it doesn't reopen on refresh
    if (urlTaskId) {
      router.replace(pathname, { scroll: false }); 
    }
  };
  // -------------------------------

  const handleAddColumn = () => {
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
    
    setColumns([...columns, newCol]);
    setNewColumnTitle("");
    setIsAddingColumn(false);
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
            className="flex h-full gap-6 overflow-x-auto pb-4 items-start"
          >
            {columns.map((column: any, index: number) => (
              <Draggable key={column.id} draggableId={column.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`flex flex-col w-80 shrink-0 rounded-2xl border p-4 transition-colors ${column.colorClass} ${snapshot.isDragging ? "shadow-xl rotate-2" : ""}`}
                  >
                    <div 
                      {...provided.dragHandleProps}
                      className="flex items-center justify-between mb-4 cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${column.dotClass}`} />
                        <h3 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wider">{column.title}</h3>
                      </div>
                      <span className="text-xs font-bold text-zinc-400">
                        {tasks.filter((t) => t.status === column.id).length}
                      </span>
                    </div>

                    <Droppable droppableId={column.id} type="task">
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`flex-1 overflow-y-auto space-y-3 custom-scrollbar min-h-[150px] ${snapshot.isDraggingOver ? "bg-zinc-100/50 rounded-xl" : ""}`}
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
                                  >
                                    <TaskCard task={task} onClick={() => setSelectedTask(task)} />
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
                    <Button variant="ghost" size="sm" onClick={() => setIsAddingColumn(false)} className="h-8 text-xs">Cancel</Button>
                    <Button size="sm" onClick={handleAddColumn} className="h-8 text-xs bg-zinc-900 text-white">Add</Button>
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
  onClose={() => setSelectedTask(null)}
  onUpdate={(data) => setTasks(tasks.map(t => t._id === selectedTask._id ? {...t, ...data} : t))}
/>

    </>
  );
}