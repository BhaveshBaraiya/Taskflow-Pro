"use client";

import { useState } from "react";
import { inviteUserToProject, toggleProjectMember } from "@/actions/team";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Mail, Search, X, Plus } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import UserAvatar from "@/components/shared/UserAvatar";

type Member = {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

export default function ManageTeamModal({ projectId, members = [], allWorkspaceMembers = [] }: { projectId: string, members: Member[], allWorkspaceMembers: Member[] }) {
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const handleInvite = async (formData: FormData) => {
    setIsInviting(true);
    setError("");
    setSuccess("");
    try {
      await inviteUserToProject(projectId, formData);
      setSuccess("Invite sent successfully!");
      (document.getElementById("invite-form") as HTMLFormElement)?.reset();
    } catch (err: any) {
      setError(err.message || "Failed to invite user.");
    } finally {
      setIsInviting(false);
    }
  };

  const toggleMember = async (userId: string, isCurrentlyInProject: boolean) => {
    await toggleProjectMember(projectId, userId, isCurrentlyInProject ? 'remove' : 'add');
  };

  const filteredMembers = allWorkspaceMembers.filter((m: any) => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold text-xs sm:text-sm h-9 sm:h-10">
          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 text-zinc-500" />
          Team ({members.length + 1})
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 border-zinc-200 bg-white shadow-xl rounded-2xl">
        <DialogHeader className="shrink-0 text-left">
          <DialogTitle className="text-lg sm:text-xl font-extrabold text-zinc-900">Manage Workspace Team</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm font-medium text-zinc-500">
            Invite colleagues or manage project members.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-1 -mr-1 mt-4 space-y-5 sm:space-y-6">
          <form id="invite-form" action={handleInvite} className="flex gap-2 shrink-0">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-zinc-400" />
              <Input 
                name="email" 
                type="email" 
                placeholder="colleague@company.com" 
                required 
                className="pl-9 h-9 sm:h-10 text-xs sm:text-sm bg-zinc-50 border-zinc-200 focus:bg-white focus:ring-1 focus:ring-zinc-900 rounded-xl transition-all"
              />
            </div>
            <Button type="submit" disabled={isInviting} className="bg-zinc-900 text-white min-w-[80px] sm:min-w-[90px] h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-bold">
              {isInviting ? <Spinner className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : "Invite"}
            </Button>
          </form>

          {error && <p className="text-xs text-red-600 font-bold mt-1 shrink-0">{error}</p>}
          {success && <p className="text-xs text-emerald-600 font-bold mt-1 shrink-0">{success}</p>}

          <div className="shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-zinc-400" />
              <Input 
                placeholder="Search all registered users..." 
                className="pl-9 h-9 sm:h-10 text-xs sm:text-sm bg-zinc-50 border-zinc-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-zinc-900 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="max-h-[120px] sm:max-h-[150px] overflow-y-auto mt-2 space-y-1 pr-1">
              {filteredMembers.map((member: any) => {
                const isInProject = members.some((m: any) => m._id === member._id);
                return (
                  <div key={member._id} className="flex items-center justify-between p-2 hover:bg-zinc-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
                      <UserAvatar user={member} className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-zinc-700 truncate">{member.name}</span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => toggleMember(member._id, isInProject)} className="h-7 w-7 sm:h-8 sm:w-8 p-0 shrink-0">
                      {isInProject ? <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" /> : <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-600" />}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4 shrink-0 pb-2">
            <h4 className="text-xs sm:text-sm font-extrabold text-zinc-900 border-b border-zinc-100 pb-2">Active Members</h4>
            
            <div className="space-y-2 sm:space-y-3 max-h-[150px] sm:max-h-[200px] overflow-y-auto pr-2">
              {members.length === 0 ? (
                <p className="text-xs sm:text-sm font-medium text-zinc-500 text-center py-4">No team members added yet.</p>
              ) : (
                members.map((member) => (
                  <div key={member._id} className="flex items-center justify-between p-1">
                    <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
                      <UserAvatar user={member} className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-zinc-900 truncate">{member.name}</span>
                        <span className="text-[10px] sm:text-xs font-medium text-zinc-500 truncate">{member.email}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toggleMember(member._id, true)} className="h-7 w-7 sm:h-8 sm:w-8 p-0 shrink-0 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}