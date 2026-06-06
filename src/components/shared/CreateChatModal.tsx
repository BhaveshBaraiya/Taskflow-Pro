"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchUsers, createConversation } from "@/actions/chat";
import { Search, Plus, X, Users, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";

type UserType = { _id: string; name: string; email: string };

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
      // Reset state
      setSelectedUsers([]);
      setGroupName("");
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
      <DialogContent className="sm:max-w-[450px] bg-white border-zinc-200 p-0 shadow-2xl overflow-hidden rounded-2xl">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <DialogTitle className="text-lg font-extrabold text-zinc-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" /> New Conversation
          </DialogTitle>
          <p className="text-sm font-medium text-zinc-500 mt-1">Search for team members to start chatting.</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Selected Users Chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
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

          {/* Group Name Input (Only shows if multiple users selected) */}
          {selectedUsers.length > 1 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Group Name</label>
              <Input 
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Marketing Campaign Q3" 
                className="bg-zinc-50 border-zinc-200 focus:bg-white"
              />
            </div>
          )}

          {/* User Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              value={query}
              onChange={handleSearch}
              placeholder="Search by name or email..." 
              className="pl-9 h-11 bg-white border-zinc-200"
            />
            {isSearching && <Spinner className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />}
          </div>

          {/* Search Results */}
          {results.length > 0 && (
            <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
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
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-zinc-200 text-zinc-700 text-xs font-bold">{user.name.substring(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{user.name}</p>
                        <p className="text-xs font-medium text-zinc-500">{user.email}</p>
                      </div>
                    </div>
                    {isSelected && <div className="h-2 w-2 rounded-full bg-blue-600 mr-2" />}
                  </div>
                );
              })}
            </div>
          )}

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