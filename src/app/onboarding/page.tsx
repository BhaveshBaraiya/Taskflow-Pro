"use client";

import { useState } from "react";
import { createWorkspace, joinWorkspace } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, KeyRound, ArrowRight } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function OnboardingPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createWorkspace(formData);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setIsCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsJoining(true);
    const formData = new FormData(e.currentTarget);
    try {
      await joinWorkspace(formData);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Building2 className="h-32 w-32 text-white" />
          </div>
          <div className="relative z-10 space-y-2 mb-12">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Create a Workspace</h2>
            <p className="text-sm font-medium text-zinc-400">
              Start a fresh environment for your company or freelance clients. You will be the owner.
            </p>
          </div>
          <form onSubmit={handleCreate} className="relative z-10 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Workspace Name</label>
              <Input 
                name="name" 
                placeholder="e.g., T3Universe Team" 
                required 
                autoComplete="off"
                className="h-12 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-700 rounded-xl"
              />
            </div>
            <Button disabled={isCreating} type="submit" className="w-full h-12 bg-white text-zinc-950 hover:bg-zinc-200 font-bold rounded-xl transition-all">
              {isCreating ? <Spinner className="h-5 w-5" /> : (
                <span className="flex items-center gap-2">Create Workspace <ArrowRight className="h-4 w-4" /></span>
              )}
            </Button>
          </form>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <KeyRound className="h-32 w-32 text-white" />
          </div>
          <div className="relative z-10 space-y-2 mb-12">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Join a Workspace</h2>
            <p className="text-sm font-medium text-zinc-400">
              Enter the 6-character invite code provided by your workspace administrator.
            </p>
          </div>
          <form onSubmit={handleJoin} className="relative z-10 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Invite Code</label>
              <Input 
                name="inviteCode" 
                placeholder="e.g., A7X9P2" 
                required 
                autoComplete="off"
                className="h-12 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-zinc-700 rounded-xl uppercase"
              />
              {errorMsg && <p className="text-xs font-bold text-red-500">{errorMsg}</p>}
            </div>
            <Button disabled={isJoining} type="submit" variant="outline" className="w-full h-12 bg-transparent border-zinc-700 text-white hover:bg-zinc-800 hover:text-white font-bold rounded-xl transition-all">
              {isJoining ? <Spinner className="h-5 w-5" /> : (
                <span className="flex items-center gap-2">Join Existing <ArrowRight className="h-4 w-4" /></span>
              )}
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}