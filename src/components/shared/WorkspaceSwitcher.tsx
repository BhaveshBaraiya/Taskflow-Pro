"use client";

import { useState, useEffect, useRef } from "react";
import { getUserWorkspaces, switchActiveWorkspace, createWorkspace, joinWorkspace } from "@/actions/workspace";
import { ChevronDown, Check, Plus, Key, ArrowLeft, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

export default function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "create" | "join">("list");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setTimeout(() => setView("list"), 200); 
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchWorkspaces = async () => {
    setLoading(true);
    const data = await getUserWorkspaces();
    setWorkspaces(data.workspaces);
    setActive(data.workspaces.find((w: any) => w._id === data.activeWorkspace));
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createWorkspace(new FormData(e.currentTarget));
      await fetchWorkspaces();
      setView("list");
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      await joinWorkspace(new FormData(e.currentTarget));
      await fetchWorkspaces();
      setView("list");
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      setErrorMsg("Invalid code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitch = async (id: string) => {
    setIsOpen(false);
    await switchActiveWorkspace(id);
    await fetchWorkspaces();
    router.refresh();
  };

  const copyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    alert(`Copied Invite Code: ${code}`);
  };

  if (loading) return <div className="h-14 w-full animate-pulse bg-zinc-100 rounded-xl" />;

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 hover:bg-zinc-100 rounded-xl cursor-pointer transition-colors group"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 shrink-0 bg-zinc-900 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-sm">
            {active?.name?.charAt(0).toUpperCase() || "W"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-sm text-zinc-900 truncate">
              {active?.name || "Select Workspace"}
            </span>
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
              Workspace
            </span>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600 shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white shadow-2xl rounded-2xl border border-zinc-200 z-50 overflow-hidden w-72">
          
          {view === "list" && (
            <div className="flex flex-col max-h-[70vh]">
              <div className="p-3 border-b border-zinc-100 text-xs font-extrabold text-zinc-400 uppercase tracking-widest">
                Your Workspaces
              </div>
              <div className="overflow-y-auto p-2 space-y-1">
                {workspaces.map((w) => (
                  <button
                    key={w._id}
                    onClick={() => handleSwitch(w._id)}
                    className="w-full flex items-center justify-between p-2 hover:bg-zinc-50 rounded-lg transition-all group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="h-8 w-8 shrink-0 bg-zinc-100 text-zinc-600 rounded-md flex items-center justify-center text-xs font-bold border border-zinc-200">
                        {w.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col items-start min-w-0">
                        <span className="truncate text-sm font-bold text-zinc-700">{w.name}</span>
                        {/* Displaying the invite code here! */}
                        <div 
                          onClick={(e) => copyCode(w.inviteCode, e)}
                          className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-blue-600 font-medium cursor-pointer"
                        >
                          Code: {w.inviteCode} <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                    {active?._id === w._id && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
              
              <div className="p-2 border-t border-zinc-100 bg-zinc-50 space-y-1">
                <button 
                  onClick={() => setView("create")}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-white rounded-lg text-sm font-bold text-zinc-700 transition-all border border-transparent hover:border-zinc-200 hover:shadow-sm"
                >
                  <Plus className="h-4 w-4 text-zinc-500" />
                  New Workspace
                </button>
                <button 
                  onClick={() => setView("join")}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-white rounded-lg text-sm font-bold text-zinc-700 transition-all border border-transparent hover:border-zinc-200 hover:shadow-sm"
                >
                  <Key className="h-4 w-4 text-zinc-500" />
                  Join Workspace
                </button>
              </div>
            </div>
          )}

          {view === "create" && (
            <div className="p-4">
              <button onClick={() => setView("list")} className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
              <h3 className="font-extrabold text-zinc-900 mb-1">Create Workspace</h3>
              <p className="text-xs font-medium text-zinc-500 mb-4">Set up a new isolated environment.</p>
              
              <form onSubmit={handleCreate} className="space-y-3">
                <Input 
                  name="name" 
                  placeholder="Workspace Name" 
                  required 
                  autoComplete="off"
                  className="h-10 bg-zinc-50 border-zinc-200 text-sm"
                />
                <Button disabled={isSubmitting} type="submit" className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white font-bold">
                  {isSubmitting ? <Spinner className="h-4 w-4" /> : "Create"}
                </Button>
              </form>
            </div>
          )}

          {view === "join" && (
            <div className="p-4">
              <button onClick={() => setView("list")} className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 mb-4 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back
              </button>
              <h3 className="font-extrabold text-zinc-900 mb-1">Join Workspace</h3>
              <p className="text-xs font-medium text-zinc-500 mb-4">Enter your 6-digit invite code.</p>
              
              <form onSubmit={handleJoin} className="space-y-3">
                <Input 
                  name="inviteCode" 
                  placeholder="e.g., A7X9P2" 
                  required 
                  autoComplete="off"
                  className="h-10 bg-zinc-50 border-zinc-200 text-sm uppercase"
                />
                {errorMsg && <p className="text-xs font-bold text-red-500">{errorMsg}</p>}
                <Button disabled={isSubmitting} type="submit" className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white font-bold">
                  {isSubmitting ? <Spinner className="h-4 w-4" /> : "Join"}
                </Button>
              </form>
            </div>
          )}

        </div>
      )}
    </div>
  );
}