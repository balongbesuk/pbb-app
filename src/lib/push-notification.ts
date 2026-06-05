import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { prisma } from './prisma'; // pastikan path ini benar
import webpush from 'web-push';

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  } catch (error: any) {
    console.warn("⚠️ Peringatan: Gagal inisialisasi Web Push VAPID (Key mungkin tidak valid):", error.message);
  }
}

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo({
  accessToken: process.env.EXPO_ACCESS_TOKEN || undefined,
});

export async function sendPushNotification({
  tokens,
  title,
  body,
  data,
  sound = 'default',
}: {
  tokens: string[];
  title: string;
  body: string;
  data?: any;
  sound?: 'default' | null;
}) {
  // Check if push notifications are enabled globally in the village configuration
  try {
    const config = await prisma.villageConfig.findFirst({ where: { id: 1 } });
    if (config && config.enablePushNotifications === false) {
      console.log("ℹ️ Push notifications are disabled globally in VillageConfig.");
      return;
    }
  } catch (err) {
    console.error("Failed to query enablePushNotifications config:", err);
  }

  // Filter out invalid tokens and remove duplicates
  const validTokens = Array.from(new Set(tokens.filter(token => Expo.isExpoPushToken(token))));
  if (validTokens.length === 0) return;

  const messages: ExpoPushMessage[] = [];
  for (const pushToken of validTokens) {
    messages.push({
      to: pushToken,
      sound: sound,
      title,
      body,
      data,
      channelId: 'default',
      priority: 'high',
    });
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
      
      // Log details of each ticket to diagnose credential or token issues
      for (let i = 0; i < ticketChunk.length; i++) {
        const ticket = ticketChunk[i];
        const message = chunk[i];
        if (ticket.status === 'error') {
          console.error(`❌ Expo Push Error for token ${message.to}:`, ticket.message);
          
          if (ticket.details?.error === 'DeviceNotRegistered') {
            try {
              const tokensToDelete = Array.isArray(message.to) ? message.to : [message.to];
              await prisma.pushSubscription.deleteMany({
                where: { token: { in: tokensToDelete } }
              });
              console.log(`🧹 Cleaned up stale token(s) from database: ${tokensToDelete.join(', ')}`);
            } catch (dbErr) {
              console.error('Failed to delete stale token from database:', dbErr);
            }
          }

          if (ticket.details) {
            console.error(`   Error details:`, JSON.stringify(ticket.details));
          }
        } else {
          console.log(`✅ Expo Push Success for token ${message.to}: Ticket ID ${ticket.id}`);
        }
      }
    } catch (error) {
      console.error('Error sending push notification chunk:', error);
    }
  }
  
  return tickets;
}

export async function notifyUser(userId: string, title: string, body: string, data?: any) {
  // 1. Send Mobile Push (Expo)
  const subs = await prisma.pushSubscription.findMany({
    where: { userId }
  });
  const tokens = subs.map(s => s.token);
  const expoPromise = sendPushNotification({ tokens, title, body, data });

  // 2. Send Web Push
  const webSubs = await prisma.webPushSubscription.findMany({
    where: { userId }
  });

  const webPushPromises = webSubs.map(async (sub) => {
    try {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify({ title, body, data, url: data?.url || '/' })
      );
    } catch (error: any) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription expired or removed
        await prisma.webPushSubscription.delete({ where: { id: sub.id } });
      } else {
        console.error("Web Push Error:", error);
      }
    }
  });

  await Promise.all([expoPromise, ...webPushPromises]);
}

export async function notifyNopSubscribers(nop: string, title: string, body: string, data?: any) {
  const cleanNop = nop.replace(/\D/g, "");
  const dp1 = cleanNop.substring(0, 2);
  const dp2 = cleanNop.substring(2, 4);
  const dp3 = cleanNop.substring(4, 7);
  const dp4 = cleanNop.substring(7, 10);
  const dp5 = cleanNop.substring(10, 13);
  const dp6 = cleanNop.substring(13, 17);
  const dp7 = cleanNop.substring(17, 18);
  const dottedNop = `${dp1}.${dp2}.${dp3}.${dp4}.${dp5}-${dp6}.${dp7}`;

  const subs = await prisma.pushSubscription.findMany({
    where: { 
      OR: [
        { nop }, 
        { nop: cleanNop }, 
        { nop: dottedNop }
      ]
    }
  });
  const tokens = subs.map(s => s.token);
  return sendPushNotification({ tokens, title, body, data });
}
