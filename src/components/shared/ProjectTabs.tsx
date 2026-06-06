"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { KanbanSquare, Key, StickyNote, FileText, Plus, X, GripHorizontal, Check, Bold, Italic, List, Link2 } from "lucide-react";
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
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [savingDocs, setSavingDocs] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (project.tabs && project.tabs.length > 0) {
      setTabsList(project.tabs);
    }
  }, [project.tabs]);

  const updateTabData = (id: string, updates: Partial<TabData>) => {
    setTabsList(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
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

  const handleSaveAllChanges = async (tabId: string) => {
    setSavingDocs(prev => ({ ...prev, [tabId]: true }));
    try {
      await saveProjectTabs(project._id, tabsList);
      setTimeout(() => setSavingDocs(prev => ({ ...prev, [tabId]: false })), 1000);
    } catch (error) {
      console.error(error);
      setSavingDocs(prev => ({ ...prev, [tabId]: false }));
    }
  };

  const getIcon = (type: string) => {
    if (type === "tasks") return <KanbanSquare className="h-4 w-4 mr-2" />;
    if (type === "access") return <Key className="h-4 w-4 mr-2" />;
    if (type === "notes") return <StickyNote className="h-4 w-4 mr-2" />;
    return <FileText className="h-4 w-4 mr-2" />;
  };

  const currentTab = tabsList.find(t => t.id === activeTab);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      
      <div className="flex items-center justify-between border-b border-zinc-200 shrink-0 w-full bg-transparent">
        
        <div className="flex-1 flex overflow-x-auto no-scrollbar">
          {tabsList.map((tab) => (
            <div 
              key={tab.id}
              draggable
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, tab.id)}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative flex items-center shrink-0 cursor-grab active:cursor-grabbing border-b-2 px-6 py-3.5 text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? "border-zinc-900 text-zinc-900 bg-white" 
                  : "border-transparent text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50/50"
              }`}
            >
              <GripHorizontal className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-opacity absolute left-2 text-zinc-300" />
              {getIcon(tab.type)}
              {tab.title}
              
              {tab.type === "doc" && (
                <button 
                  onClick={(e) => handleDeleteTab(tab.id, e)} 
                  className="ml-3 p-1 rounded-md text-zinc-300 hover:bg-red-100 hover:text-red-600 transition-all z-10"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="shrink-0 pl-4 py-2 border-l border-zinc-200 bg-zinc-50/50 flex items-center">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-zinc-900 bg-white font-bold border-zinc-300 shadow-sm hover:bg-zinc-100 mr-4">
                <Plus className="h-4 w-4 mr-1" /> Add Tab
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] border-zinc-200 bg-white p-6 shadow-xl">
              <DialogHeader><DialogTitle className="font-bold text-zinc-900">Create New Tab</DialogTitle></DialogHeader>
              <form onSubmit={handleAddTab} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Input name="title" placeholder="e.g., Marketing Assets" required className="bg-zinc-50 focus:bg-white" />
                </div>
                <Button type="submit" disabled={isAddingTab} className="bg-zinc-900 text-white w-full font-bold">
                  {isAddingTab ? <Spinner className="h-4 w-4" /> : "Create Tab"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 flex flex-col pt-6 m-0 overflow-hidden">
        {currentTab?.type === "tasks" && (
          <>
            <div className="flex flex-col gap-2 mb-6 shrink-0">
              <Input 
                value={currentTab.title} 
                onChange={(e) => updateTabData(currentTab.id, { title: e.target.value })}
                className="text-2xl font-bold text-zinc-900 p-0 border-none h-auto focus-visible:ring-0 shadow-none bg-transparent"
              />
              <div className="flex justify-between items-center gap-4">
                <Input 
                  value={currentTab.description || ""}
                  onChange={(e) => updateTabData(currentTab.id, { description: e.target.value })}
                  placeholder="Add a workflow description..."
                  className="text-sm font-medium text-zinc-500 p-0 border-none h-auto focus-visible:ring-0 shadow-none bg-transparent flex-1"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <Button onClick={() => handleSaveAllChanges(currentTab.id)} variant="ghost" size="sm" className="h-8 font-bold text-zinc-700">
                    {savingDocs[currentTab.id] ? <Check className="h-4 w-4 mr-2 text-emerald-600" /> : null}
                    {savingDocs[currentTab.id] ? "Saved" : "Save Name"}
                  </Button>
                  <CreateTaskModal projectId={project._id} columns={safeColumns} members={members} />
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-x-auto pb-4">
              <KanbanBoard initialTasks={tasks} projectId={project._id} columns={safeColumns} />
            </div>
          </>
        )}

        {currentTab?.type === "access" && (
          <div className="max-w-4xl h-full flex flex-col space-y-4 overflow-y-auto">
            <div className="flex flex-col gap-1 shrink-0">
              <Input 
                value={currentTab.title} 
                onChange={(e) => updateTabData(currentTab.id, { title: e.target.value })}
                className="text-2xl font-bold text-zinc-900 p-0 border-none h-auto focus-visible:ring-0 shadow-none bg-transparent"
              />
              <Input 
                value={currentTab.description || ""}
                onChange={(e) => updateTabData(currentTab.id, { description: e.target.value })}
                placeholder="Securely document credentials..."
                className="text-sm font-medium text-zinc-500 p-0 border-none h-auto focus-visible:ring-0 shadow-none bg-transparent w-full"
              />
            </div>
            <div className="flex-1 border border-zinc-200 rounded-2xl bg-white flex flex-col overflow-hidden shadow-sm relative min-h-[400px]">
              <div className="border-b border-zinc-100 bg-zinc-50/80 p-2 flex gap-2 justify-end">
                <Button onClick={() => handleSaveAllChanges(currentTab.id)} variant="ghost" size="sm" className="text-zinc-700 h-8 font-bold">
                  {savingDocs[currentTab.id] ? <Check className="h-4 w-4 mr-2 text-emerald-600" /> : null}
                  {savingDocs[currentTab.id] ? "Saved" : "Save All Changes"}
                </Button>
              </div>
              <Textarea 
                value={currentTab.content || ""}
                onChange={(e) => updateTabData(currentTab.id, { content: e.target.value })}
                placeholder="DEV_DB_URL=mongodb+srv://..." 
                className="flex-1 resize-none border-none focus-visible:ring-0 p-6 text-base text-zinc-800 font-mono leading-relaxed bg-white"
              />
            </div>
          </div>
        )}

        {(currentTab?.type === "notes" || currentTab?.type === "doc") && (
          <div className="max-w-4xl h-full flex flex-col space-y-4 overflow-y-auto">
            <div className="flex flex-col gap-1 shrink-0">
              <Input 
                value={currentTab.title} 
                onChange={(e) => updateTabData(currentTab.id, { title: e.target.value })}
                className="text-2xl font-bold text-zinc-900 p-0 border-none h-auto focus-visible:ring-0 shadow-none bg-transparent"
              />
              <Input 
                value={currentTab.description || ""}
                onChange={(e) => updateTabData(currentTab.id, { description: e.target.value })}
                placeholder="Document purpose or summary..."
                className="text-sm font-medium text-zinc-500 p-0 border-none h-auto focus-visible:ring-0 shadow-none bg-transparent w-full"
              />
            </div>
            <div className="flex-1 border border-zinc-200 rounded-2xl bg-white flex flex-col overflow-hidden shadow-sm relative min-h-[400px]">
              <div className="border-b border-zinc-100 bg-zinc-50/80 p-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:bg-zinc-200"><Bold className="h-4 w-4"/></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:bg-zinc-200"><Italic className="h-4 w-4"/></Button>
                  <div className="w-[1px] h-4 bg-zinc-300 mx-1" />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:bg-zinc-200"><List className="h-4 w-4"/></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:bg-zinc-200"><Link2 className="h-4 w-4"/></Button>
                </div>
                
                <Button onClick={() => handleSaveAllChanges(currentTab.id)} variant="ghost" size="sm" className="text-zinc-700 h-8 font-bold">
                  {savingDocs[currentTab.id] ? <Check className="h-4 w-4 mr-2 text-emerald-600" /> : null}
                  {savingDocs[currentTab.id] ? "Saved" : "Save All Changes"}
                </Button>
              </div>

              <Textarea 
                value={currentTab.content || ""}
                onChange={(e) => updateTabData(currentTab.id, { content: e.target.value })}
                placeholder="Start typing your document here..." 
                className="flex-1 resize-none border-none focus-visible:ring-0 p-6 text-base text-zinc-800 leading-relaxed bg-white"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}