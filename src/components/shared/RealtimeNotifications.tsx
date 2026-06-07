"use client";

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client"; 
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BellRing } from "lucide-react";

export default function RealtimeNotifications({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {    
    if (!userId || !pusherClient) return;

    const channelName = `user-${userId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind("new-notification", (data: { title: string, message: string, link: string }) => {
      toast(data.title, {
        description: data.message,
        icon: <BellRing className="h-4 w-4 text-emerald-600" />,
        action: {
          label: "View Task",
          onClick: () => router.push(data.link),
        },
        duration: 8000,
      });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [userId, router]);

  return null;
}