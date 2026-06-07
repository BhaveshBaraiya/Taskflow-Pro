"use client";

import { useState, useRef, useEffect } from "react";
import { sendMessage, searchUsers, createConversation } from "@/actions/chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Hash, CircleUser, X, FileIcon, ImageIcon, Download, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { pusherClient } from "@/lib/pusher-client";
import { uploadFiles } from "@/utils/uploadthing";
import UserAvatar from "@/components/shared/UserAvatar";

type Attachment = {
  url: string;
  fileType: string;
  name: string;
  _id?: string;
};

type MessageData = {
  _id: string;
  text: string;
  createdAt: string;
  senderId: { _id: string; name: string; email: string, avatarUrl?: string };
  attachments?: Attachment[];
};

type UserResult = {
  _id: string;
  name: string;
  email: string;
};

const forceDownload = async (url: string, filename: string, e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    window.open(url, '_blank');
  }
};

const formatMessageText = (rawText: string, onMentionClick: (name: string) => void) => {
  const parts = rawText.split(/(@[a-zA-Z0-9_]+)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("@")) {
      const name = part.slice(1);
      return (
        <span 
          key={idx} 
          onClick={() => onMentionClick(name)}
          className="font-extrabold text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded-md cursor-pointer hover:bg-blue-100 transition-colors inline-block"
        >
          {part}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
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
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const [hasMounted, setHasMounted] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: Attachment[], index: number } | null>(null);
  
  const [text, setText] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionResults, setMentionResults] = useState<UserResult[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setHasMounted(true); }, []);

 useEffect(() => {
    // We no longer need to combine prev arrays because the component unmounts!
    setMessages([...initialMessages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  }, [initialMessages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!pusherClient) return;
    const channel = pusherClient.subscribe(chatId);
    const handleNewMessage = (newMessage: MessageData) => {
      setMessages((prev) => {
        if (prev.some((msg) => msg._id === newMessage._id)) return prev;
        return [...prev, newMessage];
      });
    };
    channel.bind("new-message", handleNewMessage);
    return () => {
      if (pusherClient) {
        channel.unbind("new-message", handleNewMessage);
        pusherClient.unsubscribe(chatId);
      }
    };
  }, [chatId]);

  const handleMentionClick = async (name: string) => {
    try {
      const results = await searchUsers(name);
      if (results.length > 0) {
        await createConversation([results[0]._id], false);
      }
    } catch (error) {
      console.error("Failed to redirect to mention:", error);
    }
  };

  const handleTextChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const words = textBeforeCursor.split(/\s+/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith("@")) {
      setShowMentions(true);
      const query = lastWord.slice(1);
      if (query.length >= 1) {
        const results = await searchUsers(query);
        setMentionResults(results);
      } else {
        setMentionResults([]);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (userName: string) => {
    const cursorPosition = textInputRef.current?.selectionStart || 0;
    const textBeforeCursor = text.slice(0, cursorPosition);
    const textAfterCursor = text.slice(cursorPosition);

    const words = textBeforeCursor.split(/\s+/);
    words.pop();
    const formattedName = userName.split(" ")[0]; 
    const newTextBefore = words.length > 0 ? words.join(" ") + ` @${formattedName} ` : `@${formattedName} `;

    setText(newTextBefore + textAfterCursor);
    setShowMentions(false);
    textInputRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      let uploadedAttachments: Attachment[] = [];
      if (files.length > 0) {
        const res = await uploadFiles("chatAttachment", { files });
        if (res && res.length > 0) {
          uploadedAttachments = res.map((r, i) => ({
            url: r.url,
            fileType: files[i].type,
            name: files[i].name
          }));
        }
      }

      if (uploadedAttachments.length > 0) {
        formData.append("attachments", JSON.stringify(uploadedAttachments));
      }

      await sendMessage(chatId, chatType, formData);
      setText("");
      setFiles([]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const getFileName = (name: string) => name.length > 25 ? name.substring(0, 25) + '...' : name;

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden relative">
      
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-zinc-950/95 flex items-center justify-center backdrop-blur-md" onClick={() => setLightbox(null)}>
          <button className="absolute top-6 right-6 text-zinc-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors" onClick={() => setLightbox(null)}>
            <X className="h-6 w-6" />
          </button>
          <div className="absolute top-6 left-6 text-white font-bold bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
            {lightbox.index + 1} / {lightbox.images.length}
          </div>
          <div className="absolute top-6 right-20 flex gap-2">
            <a href={lightbox.images[lightbox.index].url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-zinc-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
              <ExternalLink className="h-6 w-6" />
            </a>
            <button onClick={(e) => forceDownload(lightbox.images[lightbox.index].url, lightbox.images[lightbox.index].name, e)} className="text-zinc-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
              <Download className="h-6 w-6" />
            </button>
          </div>
          <img src={lightbox.images[lightbox.index].url} alt="enlarged" className="max-w-[90vw] max-h-[85vh] object-contain shadow-2xl rounded-sm" onClick={(e) => e.stopPropagation()} />
          {lightbox.images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length }) }} className="absolute left-6 text-zinc-400 hover:text-white hover:bg-white/10 p-3 rounded-full transition-colors">
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.images.length }) }} className="absolute right-6 text-zinc-400 hover:text-white hover:bg-white/10 p-3 rounded-full transition-colors">
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}
        </div>
      )}

      <div className="border-b border-zinc-100 bg-white p-4 flex items-center justify-between shrink-0 shadow-sm z-10 relative">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-zinc-50 rounded-full flex items-center justify-center border border-zinc-200 shrink-0">
            {isGroup || chatType === "project" ? <Hash className="h-5 w-5 text-zinc-600" /> : <CircleUser className="h-5 w-5 text-zinc-600" />}
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
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400">
            <div className="h-12 w-12 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm"><Hash className="h-6 w-6 text-zinc-300" /></div>
            <p className="text-sm font-bold text-zinc-900">Beginning of conversation</p>
            <p className="text-xs font-medium mt-1">Send a message to start chatting.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId._id === currentUserId;
            const images = msg.attachments?.filter(a => a.fileType && a.fileType.startsWith("image/")) || [];
            const documents = msg.attachments?.filter(a => a.fileType && !a.fileType.startsWith("image/")) || [];

            return (
              <div key={msg._id} className={`flex gap-4 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                <UserAvatar 
                  user={{ 
                    name: msg.senderId.name, 
                    avatarUrl: msg.senderId.avatarUrl 
                  }} 
                  className="h-8 w-8 shrink-0 mt-1 shadow-sm border border-zinc-100"
                />
                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span className="text-xs font-bold text-zinc-900">{isMe ? "You" : msg.senderId.name}</span>
                    <span className="text-[10px] font-medium text-zinc-400">
                      {hasMounted ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>
                  
                  {images.length > 0 && (
                    <div className={`grid gap-1.5 max-w-sm mb-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {images.slice(0, 4).map((img, idx) => {
                        const isLast = idx === 3 && images.length > 4;
                        return (
                          <div key={idx} onClick={() => setLightbox({ images, index: idx })} className={`relative cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 ${images.length === 1 ? 'max-h-72 aspect-auto' : 'aspect-square'}`}>
                            <img src={img.url} alt="attachment" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                            {isLast && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl backdrop-blur-sm">
                                +{images.length - 4}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {documents.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {documents.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-1.5 bg-white border border-zinc-200 w-64 rounded-xl shadow-sm group">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 overflow-hidden flex-1 hover:bg-zinc-50 p-1.5 rounded-lg transition-colors cursor-pointer">
                            <div className="h-10 w-10 shrink-0 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100"><FileIcon className="h-5 w-5" /></div>
                            <div className="flex flex-col min-w-0 test">
                              <span className="text-xs font-bold text-zinc-900 truncate">{getFileName(doc.name)}</span>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{doc.fileType.split('/')[1] || "DOCUMENT"}</span>
                            </div>
                          </a>
                          <button onClick={(e) => forceDownload(doc.url, doc.name, e)} className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center bg-zinc-50 border border-zinc-200 hover:bg-blue-600 hover:border-blue-600 hover:text-white text-zinc-500 transition-all ml-1 z-10 cursor-pointer shadow-sm">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.text && (
                    <div className={`px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${isMe ? "bg-zinc-900 text-white rounded-2xl rounded-tr-sm" : "bg-white border border-zinc-200 text-zinc-800 rounded-2xl rounded-tl-sm"}`}>
                      {formatMessageText(msg.text, handleMentionClick)}
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
        {files.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {files.map((f, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-lg shadow-sm max-w-xs">
                {f.type.startsWith('image/') ? <ImageIcon className="h-4 w-4 shrink-0" /> : <FileIcon className="h-4 w-4 shrink-0" />}
                <span className="text-[11px] font-bold truncate">{f.name}</span>
                <button type="button" onClick={() => removeFile(idx)} className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="relative flex items-end gap-2">
          
          {showMentions && (
            <div className="absolute bottom-full left-12 mb-2 w-64 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-2 bg-zinc-50 border-b border-zinc-100 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Mention Teammate
              </div>
              <div className="max-h-48 overflow-y-auto">
                {mentionResults.length > 0 ? (
                  mentionResults.map((user) => (
                    <div key={user._id} onClick={() => insertMention(user.name)} className="flex items-center gap-3 p-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-zinc-50 last:border-0">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-zinc-900 text-white text-[9px] font-bold">
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-zinc-900 truncate">{user.name}</span>
                        <span className="text-[10px] text-zinc-500 truncate">{user.email}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-xs font-medium text-zinc-500 text-center">
                    Type a name to search...
                  </div>
                )}
              </div>
            </div>
          )}

          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple accept="image/*,application/pdf,video/*,.doc,.docx,.xls,.xlsx" />
          <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-12 w-12 shrink-0 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all">
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <Input 
            name="text" 
            ref={textInputRef}
            value={text}
            onChange={handleTextChange}
            placeholder="Write a message or type @ to mention..." 
            autoComplete="off" 
            className="w-full h-12 bg-zinc-50 border-zinc-200 focus:bg-white focus:border-zinc-300 rounded-xl shadow-sm text-[15px] px-4" 
          />
          
          <Button type="submit" disabled={isSending || (files.length === 0 && text.trim() === "")} size="icon" className="h-12 w-12 shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all">
            {isSending ? <Spinner className="h-5 w-5" /> : <Send className="h-5 w-5 ml-0.5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}