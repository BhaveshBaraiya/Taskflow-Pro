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
        <Button variant="outline" className="bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hidden sm:flex">
          <Users className="h-4 w-4 mr-2 text-zinc-500" />
          Team ({members.length + 1}) {/* +1 accounts for the owner */}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-zinc-200 bg-white shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-zinc-900">Manage Workspace Team</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Invite colleagues or manage project members.
          </DialogDescription>
        </DialogHeader>

        {/* Invite Form */}
        <form id="invite-form" action={handleInvite} className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input 
              name="email" 
              type="email" 
              placeholder="colleague@company.com" 
              required 
              className="pl-9 h-10 bg-zinc-50 border-zinc-200 focus:bg-white"
            />
          </div>
          <Button type="submit" disabled={isInviting} className="bg-zinc-900 text-white min-w-[90px]">
            {isInviting ? <Spinner className="h-4 w-4" /> : "Invite"}
          </Button>
        </form>

        {error && <p className="text-xs text-red-600 font-medium mt-1">{error}</p>}
        {success && <p className="text-xs text-emerald-600 font-medium mt-1">{success}</p>}

        {/* Search All Platform Members */}
        <div className="relative mt-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input 
            placeholder="Search all registered users..." 
            className="pl-9 h-10 bg-zinc-50 border-zinc-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="max-h-[150px] overflow-y-auto mt-2 space-y-1 pr-1">
          {filteredMembers.map((member: any) => {
            const isInProject = members.some((m: any) => m._id === member._id);
            return (
              <div key={member._id} className="flex items-center justify-between p-2 hover:bg-zinc-50 rounded">
                <div className="flex items-center gap-3">
                  <UserAvatar user={member} className="h-6 w-6" />
                  <span className="text-sm text-zinc-700">{member.name}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => toggleMember(member._id, isInProject)}>
                  {isInProject ? <X className="h-4 w-4 text-red-500" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Active Members List */}
        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Active Members</h4>
          
          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
            {members.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No team members added yet.</p>
            ) : (
              members.map((member) => (
                <div key={member._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={member} className="h-8 w-8" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-900">{member.name}</span>
                      <span className="text-xs text-zinc-500">{member.email}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => toggleMember(member._id, true)}>
                    <X className="h-4 w-4 text-zinc-400" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}