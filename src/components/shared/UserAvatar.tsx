import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserAvatar({ user, className }: { 
  user: { name: string, avatarUrl?: string }, 
  className?: string 
}) {
  return (
    <Avatar className={className}>      
      <AvatarImage src={user.avatarUrl} className="object-cover" />
      <AvatarFallback className="bg-zinc-900 text-white font-bold text-[10px]">
        {user.name?.substring(0, 2).toUpperCase() || "??"}
      </AvatarFallback>
    </Avatar>
  );
}