import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { prisma } from './prisma'; // pastikan path ini benar

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo();

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
  // Filter out invalid tokens
  const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));
  if (validTokens.length === 0) return;

  const messages: ExpoPushMessage[] = [];
  for (const pushToken of validTokens) {
    messages.push({
      to: pushToken,
      sound: sound,
      title,
      body,
      data,
    });
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push notification chunk:', error);
    }
  }
  
  return tickets;
}

export async function notifyUser(userId: string, title: string, body: string, data?: any) {
  const subs = await prisma.pushSubscription.findMany({
    where: { userId }
  });
  const tokens = subs.map(s => s.token);
  return sendPushNotification({ tokens, title, body, data });
}

export async function notifyNopSubscribers(nop: string, title: string, body: string, data?: any) {
  const subs = await prisma.pushSubscription.findMany({
    where: { nop }
  });
  const tokens = subs.map(s => s.token);
  return sendPushNotification({ tokens, title, body, data });
}
