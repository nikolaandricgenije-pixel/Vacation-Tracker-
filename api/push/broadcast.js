const webPush = require('web-push');

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
  if (req.method === 'POST') {
    const { type, title, body } = req.body;

    const payload = JSON.stringify({
      type: type || 'general',
      title: title || 'Vacation Tracker',
      body: body || 'You have a new notification',
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    });

    const results = [];
    const errors = [];

    for (const [userId, subscription] of subscriptions.entries()) {
      try {
        await webPush.sendNotification(subscription, payload);
        results.push({ userId, success: true });
      } catch (error) {
        errors.push({ userId, error: error.message });
        if (error.statusCode === 410) {
          subscriptions.delete(userId);
        }
      }
    }

    res.json({
      success: true,
      message: `Broadcast sent to ${results.length} users`,
      results,
      errors
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}