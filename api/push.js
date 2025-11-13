import webPush from 'web-push';
import { db } from './drizzle/db.js';
import { users } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

const subscriptions = new Map();

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nqm-UI',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls'
};

webPush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ publicKey: vapidKeys.publicKey });
  }

  if (req.method === 'POST') {
    const { action, userId, subscription, type, title, body } = req.body;

    try {
      switch (action) {
        case 'subscribe':
          res.status(201).json({
            success: true,
            message: 'Subscription saved',
            vapidPublicKey: vapidKeys.publicKey
          });
          break;

        case 'send':
          const userSubscription = subscriptions.get(userId);

          if (!userSubscription) {
            return res.status(404).json({
              success: false,
              message: 'No subscription found for user'
            });
          }

          const payload = JSON.stringify({
            type: type || 'general',
            title: title || 'Vacation Tracker',
            body: body || 'You have a new notification',
            icon: '/icon-192.png',
            badge: '/icon-192.png'
          });

          await webPush.sendNotification(userSubscription, payload);

          res.json({
            success: true,
            message: 'Push notification sent successfully'
          });
          break;

        case 'broadcast':
          const broadcastPayload = JSON.stringify({
            type: type || 'general',
            title: title || 'Vacation Tracker',
            body: body || 'You have a new notification',
            icon: '/icon-192.png',
            badge: '/icon-192.png'
          });

          const results = [];
          const errors = [];

          for (const [uid, sub] of subscriptions.entries()) {
            try {
              await webPush.sendNotification(sub, broadcastPayload);
              results.push({ userId: uid, success: true });
            } catch (error) {
              errors.push({ userId: uid, error: error.message });
              if (error.statusCode === 410) {
                subscriptions.delete(uid);
              }
            }
          }

          res.json({
            success: true,
            message: `Broadcast sent to ${results.length} users`,
            results,
            errors
          });
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action. Use: subscribe, send, or broadcast'
          });
      }
    } catch (error) {
      console.error('Push notification error:', error);

      if (error.statusCode === 410) {
        subscriptions.delete(userId);
      }

      res.status(500).json({
        success: false,
        message: 'Failed to process push notification request',
        error: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
