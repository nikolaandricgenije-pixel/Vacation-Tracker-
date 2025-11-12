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
    const { userId, type, title, body } = req.body;

    try {
      const subscription = subscriptions.get(userId);

      if (!subscription) {
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

      await webPush.sendNotification(subscription, payload);

      res.json({
        success: true,
        message: 'Push notification sent successfully'
      });
    } catch (error) {
      console.error('Error sending push notification:', error);

      if (error.statusCode === 410) {
        subscriptions.delete(userId);
      }

      res.status(500).json({
        success: false,
        message: 'Failed to send push notification',
        error: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}