"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchUsers, createConversation } from "@/actions/chat";
import { Search, Plus, X, Users, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import UserAvatar from "./UserAvatar";

type UserType = { _id: string; name: string; email: string; avatarUrl?: string };

export default function CreateChatModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserType[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserType[]>([]);
  const [groupName, setGroupName] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    if (val.length < 2) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    const users = await searchUsers(val);
    setResults(users);
    setIsSearching(false);
  };

  const toggleUser = (user: UserType) => {
    if (selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
    setQuery("");
    setResults([]);
  };

  const handleCreate = async () => {
    if (selectedUsers.length === 0) return;
    setIsCreating(true);
    
    const isGroup = selectedUsers.length > 1;
    const userIds = selectedUsers.map(u => u._id);
    
    try {
      await createConversation(userIds, isGroup, groupName);  
      setIsOpen(false); 
    } catch (error) {
      console.error(error);
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="h-8 w-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:shadow-sm transition-all">
          <Plus className="h-4 w-4" />
        </button>
      </DialogTrigger>
      {/* FIXED: Added max-h-[85vh] and flex-col to keep the modal inside the viewport when keyboard opens */}
      <DialogContent className="sm:max-w-[450px] w-[95vw] max-h-[85vh] md:max-h-[90vh] bg-white border-zinc-200 p-0 shadow-2xl overflow-hidden rounded-2xl flex flex-col">
        
        {/* Pinned Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
          <DialogTitle className="text-lg font-extrabold text-zinc-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" /> New Conversation
          </DialogTitle>
          <p className="text-xs sm:text-sm font-medium text-zinc-500 mt-1">Search for team members to start chatting.</p>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar flex-1 min-h-0">          
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 shrink-0">
              {selectedUsers.map(user => (
                <div key={user._id} className="flex items-center gap-1.5 bg-zinc-100 border border-zinc-200 pl-1.5 pr-2 py-1 rounded-full text-xs font-bold text-zinc-800">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="bg-zinc-900 text-white text-[9px]">{user.name.substring(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {user.name.split(" ")[0]}
                  <X className="h-3 w-3 text-zinc-400 hover:text-red-500 cursor-pointer ml-1" onClick={() => toggleUser(user)} />
                </div>
              ))}
            </div>
          )}
          
          {selectedUsers.length > 1 && (
            <div className="space-y-2 shrink-0">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Group Name</label>
              <Input 
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Marketing Campaign Q3" 
                className="bg-zinc-50 border-zinc-200 focus:bg-white text-base sm:text-sm" // text-base prevents iOS Safari zoom on focus
              />
            </div>
          )}
          
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              value={query}
              onChange={handleSearch}
              placeholder="Search by name or email..." 
              className="pl-9 h-11 bg-white border-zinc-200 text-base sm:text-sm" // text-base prevents iOS Safari zoom
            />
            {isSearching && <Spinner className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />}
          </div>
          
          {/* Search Results Area */}
          {results.length > 0 && (
            <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm shrink-0">
              {results.map(user => {
                const isSelected = selectedUsers.some(u => u._id === user._id);
                return (
                  <div 
                    key={user._id} 
                    onClick={() => toggleUser(user)}
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors border-b border-zinc-100 last:border-0 ${
                      isSelected ? "bg-blue-50" : "hover:bg-zinc-50 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <UserAvatar 
                          user={{ name: user.name, avatarUrl: user.avatarUrl }} 
                          className="h-8 w-8 shrink-0" 
                        />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-zinc-900 truncate">{user.name}</p>
                        <p className="text-[10px] sm:text-xs font-medium text-zinc-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    {isSelected && <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0 ml-2" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pinned Footer (Submit Button) */}
        <div className="p-4 sm:p-6 border-t border-zinc-100 bg-white shrink-0">
          <Button 
            onClick={handleCreate} 
            disabled={selectedUsers.length === 0 || isCreating || (selectedUsers.length > 1 && !groupName)} 
            className="w-full h-11 bg-zinc-900 text-white hover:bg-zinc-800 font-bold"
          >
            {isCreating ? <Spinner className="h-4 w-4 mr-2" /> : <Users className="h-4 w-4 mr-2" />}
            {selectedUsers.length > 1 ? "Create Group Chat" : "Start Conversation"}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}