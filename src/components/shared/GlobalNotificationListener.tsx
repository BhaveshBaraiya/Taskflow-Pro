"use client";

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client"; 
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BellRing } from "lucide-react";

export default function GlobalNotificationListener({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (!currentUserId || !pusherClient) return;

    const channelName = `user-${currentUserId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind("new-notification", (data: { title: string; message: string; link?: string }) => {
      
      toast(data.title, {
        description: data.message,
        icon: <BellRing className="h-4 w-4 text-emerald-600" />,
        duration: 8000,
        action: data.link ? {
          label: "View",
          onClick: () => router.push(data.link as string)
        } : undefined,
      });

      if ("Notification" in window && Notification.permission === "granted") {
        const browserNotification = new Notification(data.title, {
          body: data.message,
          icon: "/favicon.ico", 
        });

        browserNotification.onclick = () => {
          window.focus();
          if (data.link) {
            router.push(data.link);
          }
          browserNotification.close();
        };
      }

      router.refresh();
    });
    
    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [currentUserId, router]);

  return null; 
}