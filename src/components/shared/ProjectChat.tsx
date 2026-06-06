"use client";

import { useState, useRef, useEffect } from "react";
import { sendMessage } from "@/actions/chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Hash, CircleUser, X, FileIcon, ImageIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { pusherClient } from "@/lib/pusher-client";

type MessageData = {
  _id: string;
  text: string;
  createdAt: string;
  senderId: { _id: string; name: string; email: string };
  attachmentUrl?: string;
  attachmentType?: string;
};

export default function ProjectChat({ 
  chatId, 
  chatType,
  chatTitle,
  isGroup,
  initialMessages, 
  currentUserId 
}: { 
  chatId: string; 
  chatType: "project" | "dm";
  chatTitle: string;
  isGroup: boolean;
  initialMessages: MessageData[];
  currentUserId?: string;
}) {
  const [isSending, setIsSending] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!pusherClient) return;

    const channel = pusherClient.subscribe(chatId);
    channel.bind("new-message", (newMessage: MessageData) => {
      setMessages((prev) => {
        if (prev.some((msg) => msg._id === newMessage._id)) return prev;
        return [...prev, newMessage];
      });
    });

    return () => {
      if (pusherClient) {
        pusherClient.unsubscribe(chatId);
        channel.unbind_all();
      }
    };
  }, [chatId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);
    
    const formData = new FormData(e.currentTarget);
    if (file) {
      formData.append("file", file);
    }

    try {
      await sendMessage(chatId, chatType, formData);
      (e.target as HTMLFormElement).reset();
      setFile(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      
      <div className="border-b border-zinc-100 bg-white p-4 flex items-center justify-between shrink-0 shadow-sm z-10 relative">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-zinc-50 rounded-full flex items-center justify-center border border-zinc-200 shrink-0">
            {isGroup || chatType === "project" ? (
              <Hash className="h-5 w-5 text-zinc-600" />
            ) : (
              <CircleUser className="h-5 w-5 text-zinc-600" />
            )}
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900 text-base tracking-tight line-clamp-1">{chatTitle}</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {chatType === "project" ? "Project Channel" : isGroup ? "Group Chat" : "Direct Message"}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30 custom-scrollbar">
        {initialMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400">
            <div className="h-12 w-12 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <Hash className="h-6 w-6 text-zinc-300" />
            </div>
            <p className="text-sm font-bold text-zinc-900">Beginning of conversation</p>
            <p className="text-xs font-medium mt-1">Send a message to start chatting.</p>
          </div>
        ) : (
          initialMessages.map((msg) => {
            const isMe = msg.senderId._id === currentUserId;
            return (
              <div key={msg._id} className={`flex gap-4 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                <Avatar className="h-8 w-8 shrink-0 mt-1 shadow-sm border border-zinc-100">
                  <AvatarFallback className={`${isMe ? "bg-zinc-900 text-white" : "bg-white text-zinc-700"} text-xs font-bold`}>
                    {msg.senderId.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span className="text-xs font-bold text-zinc-900">{isMe ? "You" : msg.senderId.name}</span>
                    <span className="text-[10px] font-medium text-zinc-400">
                      {hasMounted ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>
                  
                  {msg.attachmentUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
                      {msg.attachmentType?.startsWith("image/") ? (
                        <img src={msg.attachmentUrl} alt="attachment" className="max-w-full max-h-60 object-cover" />
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-white w-64">
                          <FileIcon className="h-6 w-6 text-blue-600 shrink-0" />
                          <span className="text-xs font-bold truncate text-zinc-700">Attached Document</span>
                        </div>
                      )}
                    </div>
                  )}

                  {msg.text && (
                    <div className={`px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
                      isMe 
                        ? "bg-zinc-900 text-white rounded-2xl rounded-tr-sm" 
                        : "bg-white border border-zinc-200 text-zinc-800 rounded-2xl rounded-tl-sm"
                    }`}>
                      {msg.text}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 bg-white border-t border-zinc-100 flex flex-col shrink-0">
        
        {file && (
          <div className="mb-3 flex items-center">
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-lg shadow-sm max-w-sm">
              {file.type.startsWith('image/') ? <ImageIcon className="h-4 w-4 shrink-0" /> : <FileIcon className="h-4 w-4 shrink-0" />}
              <span className="text-xs font-bold truncate">{file.name}</span>
              <button type="button" onClick={removeFile} className="ml-2 hover:bg-blue-200 rounded-full p-0.5 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="relative flex items-end gap-2">
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden" 
            accept="image/*,application/pdf,video/*,.doc,.docx,.xls,.xlsx"
          />

          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-12 w-12 shrink-0 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <Input 
            name="text" 
            placeholder="Write a message..." 
            autoComplete="off"
            className="w-full h-12 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-zinc-300 rounded-xl shadow-sm text-[15px] px-4"
          />
          
          <Button 
            type="submit" 
            disabled={isSending || (!file && false)} 
            size="icon" 
            className="h-12 w-12 shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all"
          >
            {isSending ? <Spinner className="h-5 w-5" /> : <Send className="h-5 w-5 ml-0.5" />}
          </Button>
        </form>
      </div>

    </div>
  );
}