"use client";

import { useState } from "react";
import { createWorkspace, joinWorkspace } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, KeyRound, ArrowRight, Hexagon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    try {
      await createWorkspace(formData);
      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Failed to create workspace.");
      setIsCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsJoining(true);
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    try {
      await joinWorkspace(formData);
      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Invalid invite code.");
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col relative selection:bg-zinc-200">
      
      {/* Top Half Background with subtle pattern */}
      <div className="absolute top-0 left-0 w-full h-[55vh] bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-8 mt-10">
        
        {/* Header / Logo Area */}
        <div className="w-full max-w-4xl mb-12 flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-md mb-6">
            <Hexagon className="h-8 w-8 text-zinc-900 fill-zinc-900" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Welcome to TaskFlow Pro
          </h1>
          <p className="text-zinc-400 font-medium max-w-lg text-sm sm:text-base leading-relaxed">
            Let's get your environment set up. Create a brand new workspace for your team, or join an existing one using an invite code.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 md:gap-8">
          
          {/* Create Workspace Card */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 flex flex-col justify-between shadow-xl shadow-zinc-200/50 relative overflow-hidden group hover:border-zinc-300 transition-colors">
            
            <div className="space-y-4 mb-8">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Building2 className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Create a Workspace</h2>
              <p className="text-sm font-medium text-zinc-500 leading-relaxed">
                Start a fresh environment for your company or freelance clients. You will be assigned as the owner.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Workspace Name</label>
                <Input 
                  name="name" 
                  placeholder="e.g., Acme Corp" 
                  required 
                  autoComplete="off"
                  className="h-12 bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white rounded-xl font-medium transition-colors"
                />
              </div>
              <Button disabled={isCreating} type="submit" className="w-full h-12 bg-zinc-900 text-white hover:bg-zinc-800 font-bold rounded-xl transition-all group-hover:shadow-md">
                {isCreating ? <Spinner className="h-5 w-5" /> : (
                  <span className="flex items-center gap-2">Initialize Workspace <ArrowRight className="h-4 w-4" /></span>
                )}
              </Button>
            </form>
          </div>

          {/* Join Workspace Card */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 flex flex-col justify-between shadow-xl shadow-zinc-200/50 relative overflow-hidden group hover:border-zinc-300 transition-colors">
            
            <div className="space-y-4 mb-8">
              <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <KeyRound className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Join a Workspace</h2>
              <p className="text-sm font-medium text-zinc-500 leading-relaxed">
                Enter the 6-character invite code provided by your workspace administrator or team leader.
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Invite Code</label>
                <Input 
                  name="inviteCode" 
                  placeholder="e.g., A7X9P2" 
                  required 
                  autoComplete="off"
                  className="h-12 bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white rounded-xl uppercase font-mono tracking-widest text-center transition-colors"
                />
              </div>
              {errorMsg && <p className="text-xs font-bold text-red-500 text-center">{errorMsg}</p>}
              <Button disabled={isJoining} type="submit" variant="outline" className="w-full h-12 bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 font-bold rounded-xl transition-all group-hover:border-zinc-300">
                {isJoining ? <Spinner className="h-5 w-5" /> : (
                  <span className="flex items-center gap-2">Join Existing <ArrowRight className="h-4 w-4" /></span>
                )}
              </Button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}