"use client";

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client"; // Adjust to your exact file name
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function GlobalNotificationListener({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();

  useEffect(() => {
    // 1. Request browser notification permission on mount
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (!currentUserId || !pusherClient) return;

    const channelName = `user-${currentUserId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind("new-notification", (data: { title: string; message: string; type: string; link?: string }) => {
      
      // 2. Fire the in-app Sonner Toast
      toast(data.title, {
        description: data.message,
        action: data.link ? {
          label: "View",
          onClick: () => router.push(data.link as string)
        } : undefined,
      });

      // 3. Fire the Native Browser Notification
      if ("Notification" in window && Notification.permission === "granted") {
        const browserNotification = new Notification(data.title, {
          body: data.message,
          icon: "/favicon.ico", // Ensure you have a favicon or replace with a logo URL
        });

        // If they click the OS notification, focus the window and navigate
        browserNotification.onclick = () => {
          window.focus();
          if (data.link) {
            router.push(data.link);
          }
          browserNotification.close();
        };
      }

      // 4. Silently refresh server components
      router.refresh();
    });

    return () => {
      if (pusherClient) {
        pusherClient.unsubscribe(channelName);
      }
    };
  }, [currentUserId, router]);

  return null; 
}