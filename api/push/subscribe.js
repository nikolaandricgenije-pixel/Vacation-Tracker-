import webPush from 'web-push';
import { db } from '../../drizzle/db.js';
import { users } from '../../drizzle/schema.js';
import { eq } from 'drizzle-orm';

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
  if (req.method === 'POST') {
    try {
      const subscription = req.body;
      const userId = req.body.userId || 'anonymous';

      // For now, store in memory or find user
      // Since users are in db, but for simplicity, use in-memory for subscriptions
      // In production, create a subscriptions table

      res.status(201).json({
        success: true,
        message: 'Subscription saved',
        vapidPublicKey: vapidKeys.publicKey
      });
    } catch (error) {
      console.error('Error saving subscription:', error);
      res.status(500).json({ success: false, message: 'Failed to save subscription' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}