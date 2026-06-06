"use client";

import { useState } from "react";
import { inviteUserToProject } from "@/actions/team";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Mail } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Member = {
  _id: string;
  name: string;
  email: string;
};

export default function ManageTeamModal({ projectId, members = [] }: { projectId: string, members: Member[] }) {
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInvite = async (formData: FormData) => {
    setIsInviting(true);
    setError("");
    setSuccess("");
    
    try {
      // Because we throw standard Errors in our server action, 
      // we need a slightly different pattern to catch them nicely in the UI
      await inviteUserToProject(projectId, formData);
      setSuccess("Invite sent successfully!");
      (document.getElementById("invite-form") as HTMLFormElement)?.reset();
    } catch (err: any) {
      setError(err.message || "Failed to invite user.");
    } finally {
      setIsInviting(false);
    }
  };

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
            Invite colleagues to collaborate on this project.
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

        {/* Status Messages */}
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        {success && <p className="text-xs text-emerald-600 font-medium">{success}</p>}

        {/* Member List */}
        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">Active Members</h4>
          
          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
            {members.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No team members invited yet.</p>
            ) : (
              members.map((member) => (
                <div key={member._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-zinc-200">
                      <AvatarFallback className="bg-zinc-100 text-zinc-600 text-xs font-medium">
                        {member.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-900">{member.name}</span>
                      <span className="text-xs text-zinc-500">{member.email}</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-zinc-400 bg-zinc-50 px-2 py-1 rounded">Member</span>
                </div>
              ))
            )}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}