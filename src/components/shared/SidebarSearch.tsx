"use client";

import { useState } from "react";
import { searchUsers, createConversation } from "@/actions/chat";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import UserAvatar from "./UserAvatar";

export default function SidebarSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const handleStartChat = async (userId: string) => {
    setQuery("");
    setResults([]);
    await createConversation([userId], false);
  };

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
      <Input
        value={query}
        onChange={handleSearch}
        placeholder="Search users to chat..."
        className="pl-9 h-9 bg-white border-zinc-200 text-xs shadow-sm"
      />
      {isSearching && <Spinner className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400" />}

      {results.length > 0 && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 bg-zinc-50 border-b border-zinc-100 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Start Conversation
          </div>
          <div className="max-h-48 overflow-y-auto">
            {results.map((user) => (
              <div
                key={user._id}
                onClick={() => handleStartChat(user._id)}
                className="flex items-center gap-3 p-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-zinc-50 last:border-0"
              >
                <UserAvatar 
                    user={{ name: user.name, avatarUrl: user.avatarUrl }} 
                    className="h-8 w-8" 
                  />
                <div className="flex flex-col min-w-0 test-2">
                  <span className="text-xs font-bold text-zinc-900 truncate">{user.name}</span>
                  <span className="text-[10px] text-zinc-500 truncate">{user.email}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}