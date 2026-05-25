"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

function urlB64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function WebPushProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!session || isSubscribed) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    async function registerServiceWorker() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const applicationServerKey = urlB64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        );

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
        }

        // Send to backend
        await fetch("/api/web-push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(subscription),
        });

        setIsSubscribed(true);
      } catch (error) {
        console.error("Service Worker/Web Push Error:", error);
      }
    }

    registerServiceWorker();
  }, [session, isSubscribed]);

  return <>{children}</>;
}
