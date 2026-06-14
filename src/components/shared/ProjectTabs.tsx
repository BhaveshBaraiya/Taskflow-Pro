"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { KanbanSquare, Key, StickyNote, FileText, Plus, X, GripHorizontal, Bold, Italic, List, Link2 } from "lucide-react";
import { addProjectTab, saveProjectTabs, deleteProjectTab } from "@/actions/project";
import { Spinner } from "@/components/ui/spinner";
import KanbanBoard from "@/components/shared/KanbanBoard";
import CreateTaskModal from "@/components/shared/CreateTaskModal";

type TabData = { id: string; title: string; type: string; content?: string; description?: string };

export default function ProjectTabs({ 
  project, 
  tasks, 
  members, 
  safeColumns 
}: { 
  project: any, tasks: any[], members: any[], safeColumns: any[] 
}) {
  const defaultTabs = [
    { id: "tasks", title: "Tasks", type: "tasks", description: "Active workflow and task management." },
    { id: "access", title: "Access", type: "access", description: "Securely document server credentials and connection strings." },
    { id: "notes", title: "Notes", type: "notes", description: "Centralized documentation and project scratchpad." }
  ];
  
  const initialTabs = project.tabs && project.tabs.length > 0 ? project.tabs : defaultTabs;
  
  const [tabsList, setTabsList] = useState<TabData[]>(initialTabs);
  const [activeTab, setActiveTab] = useState(initialTabs[0].id);
  const [editingTabId, setEditingTabId] = useState<string | null>(null); // NEW: Tracks which tab is being renamed
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateTabData = (id: string, updates: Partial<TabData>) => {
    setTabsList(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveProjectTabs(project._id, next).catch(console.error);
      }, 1000);
      
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    e.dataTransfer.setData("tabId", tabId);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => { (e.target as HTMLElement).style.opacity = "0.4"; }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    const sourceTabId = e.dataTransfer.getData("tabId");
    if (!sourceTabId || sourceTabId === targetTabId) return;

    const newTabs = [...tabsList];
    const sourceIdx = newTabs.findIndex(t => t.id === sourceTabId);
    const targetIdx = newTabs.findIndex(t => t.id === targetTabId);
    
    const [movedTab] = newTabs.splice(sourceIdx, 1);
    newTabs.splice(targetIdx, 0, movedTab);
    
    setTabsList(newTabs);
    try { await saveProjectTabs(project._id, newTabs); } catch (error) { console.error(error); }
  };

  const handleAddTab = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAddingTab(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    
    try {
      const newId = await addProjectTab(project._id, title);
      const newTab = { id: newId, title, type: "doc", content: "", description: "Custom Document View" };
      setTabsList([...tabsList, newTab]);
      setActiveTab(newId);
      setIsModalOpen(false); 
    } catch (error) {
      console.error(error);
    } finally {
      setIsAddingTab(false);
    }
  };

  const handleDeleteTab = async (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = tabsList.filter(t => t.id !== tabId);
    setTabsList(filtered);
    if (activeTab === tabId) setActiveTab(filtered[0]?.id || "");
    try { await deleteProjectTab(project._id, tabId); } catch (error) { console.error(error); }
  };

  const getIcon = (type: string) => {
    if (type === "tasks") return <KanbanSquare className="h-4 w-4 mr-2 shrink-0" />;
    if (type === "access") return <Key className="h-4 w-4 mr-2 shrink-0" />;
    if (type === "notes") return <StickyNote className="h-4 w-4 mr-2 shrink-0" />;
    return <FileText className="h-4 w-4 mr-2 shrink-0" />;
  };

  const currentTab = tabsList.find(t => t.id === activeTab);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      
      {/* --- TAB HEADERS ROW --- */}
      <div className="flex items-center justify-between border-b border-zinc-200 shrink-0 w-full bg-transparent overflow-x-auto no-scrollbar">
        
        <div className="flex-1 flex w-full">
          {tabsList.map((tab) => (
            <div 
              key={tab.id}
              draggable
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, tab.id)}
              onClick={() => {
                // NEW: Click to switch, click again to edit
                if (activeTab === tab.id) {
                  setEditingTabId(tab.id);
                } else {
                  setActiveTab(tab.id);
                  setEditingTabId(null);
                }
              }}
              className={`group relative flex items-center shrink-0 cursor-grab active:cursor-grabbing border-b-2 px-4 sm:px-6 py-3.5 text-xs sm:text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? "border-zinc-900 text-zinc-900 bg-white" 
                  : "border-transparent text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50/50"
              }`}
            >
              <GripHorizontal className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity absolute left-1 sm:left-2 text-zinc-300 hidden sm:block" />
              {getIcon(tab.type)}                          
              {editingTabId === tab.id ? (
                <input 
                  value={tab.title}
                  onChange={(e) => updateTabData(tab.id, { title: e.target.value })}
                  onBlur={() => setEditingTabId(null)}
                  onKeyDown={(e) => { if(e.key === 'Enter') setEditingTabId(null) }}
                  autoFocus
                  className="bg-transparent border-none p-0 m-0 focus:ring-0 font-bold text-zinc-900 w-[100px] sm:w-[150px] outline-none"
                />
              ) : (
                <span className="truncate max-w-[100px] sm:max-w-[200px] cursor-text" title="Click again to rename">{tab.title}</span>
              )}
              
              {tab.type === "doc" && (
                <button 
                  onClick={(e) => handleDeleteTab(tab.id, e)} 
                  className="ml-2 sm:ml-3 p-1 rounded-md text-zinc-300 hover:bg-red-100 hover:text-red-600 transition-all z-10 shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* ADD TAB BUTTON */}
        <div className="shrink-0 pl-2 sm:pl-4 py-2 border-l border-zinc-200 bg-zinc-50/50 flex items-center sticky right-0">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm text-zinc-900 bg-white font-bold border-zinc-300 shadow-sm hover:bg-zinc-100 mr-2 sm:mr-4 shrink-0">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" /> <span className="hidden sm:inline">Add Tab</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[400px] border-zinc-200 bg-white p-4 sm:p-6 shadow-xl rounded-2xl">
              <DialogHeader><DialogTitle className="font-extrabold text-zinc-900 text-left">Create New Tab</DialogTitle></DialogHeader>
              <form onSubmit={handleAddTab} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Input name="title" placeholder="e.g., Marketing Assets" required className="bg-zinc-50 focus:bg-white h-10 sm:h-11 rounded-xl focus:ring-1 focus:ring-zinc-900" />
                </div>
                <Button type="submit" disabled={isAddingTab} className="bg-zinc-900 text-white w-full font-bold h-10 sm:h-11 rounded-xl">
                  {isAddingTab ? <Spinner className="h-4 w-4" /> : "Create Tab"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* --- TAB CONTENT PANELS --- */}
      <div className="flex-1 flex flex-col pt-4 sm:pt-6 m-0 overflow-hidden">
        {currentTab?.type === "tasks" && (
          <>
            <div className="flex flex-col gap-2 mb-4 sm:mb-6 shrink-0">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
                <Input 
                  value={currentTab.description || ""}
                  onChange={(e) => updateTabData(currentTab.id, { description: e.target.value })}
                  placeholder="Add a workflow description..."
                  className="text-xs sm:text-sm font-medium text-zinc-500 p-0 border-none h-auto focus-visible:ring-0 shadow-none bg-transparent w-full sm:flex-1"
                />
                <div className="w-full sm:w-auto shrink-0 flex">
                  <div className="w-full sm:w-auto">
                    <CreateTaskModal projectId={project._id} columns={safeColumns} members={members} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-x-auto pb-4">
              <KanbanBoard initialTasks={tasks} members={members} projectId={project._id} initialColumns={safeColumns} />
            </div>
          </>
        )}

        {currentTab?.type === "access" && (
          <div className="max-w-4xl h-full flex flex-col space-y-3 sm:space-y-4 overflow-y-auto pb-6">
            <div className="flex flex-col gap-1 shrink-0">
              <Input 
                value={currentTab.description || ""}
                onChange={(e) => updateTabData(currentTab.id, { description: e.target.value })}
                placeholder="Securely document credentials..."
                className="text-xs sm:text-sm font-medium text-zinc-500 p-0 border-none h-auto focus-visible:ring-0 shadow-none bg-transparent w-full"
              />
            </div>
            <div className="flex-1 border border-zinc-200 rounded-xl sm:rounded-2xl bg-white flex flex-col overflow-hidden shadow-sm relative min-h-[300px] sm:min-h-[400px]">
              <Textarea 
                value={currentTab.content || ""}
                onChange={(e) => updateTabData(currentTab.id, { content: e.target.value })}
                placeholder="DEV_DB_URL=mongodb+srv://..." 
                className="flex-1 resize-none border-none focus-visible:ring-0 p-4 sm:p-6 text-xs sm:text-base text-zinc-800 font-mono leading-relaxed bg-white"
              />
            </div>
          </div>
        )}

        {(currentTab?.type === "notes" || currentTab?.type === "doc") && (
          <div className="max-w-4xl h-full flex flex-col space-y-3 sm:space-y-4 overflow-y-auto pb-6">
            <div className="flex flex-col gap-1 shrink-0">
              <Input 
                value={currentTab.description || ""}
                onChange={(e) => updateTabData(currentTab.id, { description: e.target.value })}
                placeholder="Document purpose or summary..."
                className="text-xs sm:text-sm font-medium text-zinc-500 p-0 border-none h-auto focus-visible:ring-0 shadow-none bg-transparent w-full"
              />
            </div>
            <div className="flex-1 border border-zinc-200 rounded-xl sm:rounded-2xl bg-white flex flex-col overflow-hidden shadow-sm relative min-h-[300px] sm:min-h-[400px]">
              <div className="border-b border-zinc-100 bg-zinc-50/80 p-1.5 sm:p-2 flex items-center justify-between overflow-x-auto no-scrollbar gap-4">
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-zinc-600 hover:bg-zinc-200"><Bold className="h-3.5 w-3.5 sm:h-4 sm:w-4"/></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-zinc-600 hover:bg-zinc-200"><Italic className="h-3.5 w-3.5 sm:h-4 sm:w-4"/></Button>
                  <div className="w-[1px] h-4 bg-zinc-300 mx-0.5 sm:mx-1" />
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-zinc-600 hover:bg-zinc-200"><List className="h-3.5 w-3.5 sm:h-4 sm:w-4"/></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-zinc-600 hover:bg-zinc-200"><Link2 className="h-3.5 w-3.5 sm:h-4 sm:w-4"/></Button>
                </div>
              </div>

              <Textarea 
                value={currentTab.content || ""}
                onChange={(e) => updateTabData(currentTab.id, { content: e.target.value })}
                placeholder="Start typing your document here..." 
                className="flex-1 resize-none border-none focus-visible:ring-0 p-4 sm:p-6 text-sm sm:text-base text-zinc-800 leading-relaxed bg-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}