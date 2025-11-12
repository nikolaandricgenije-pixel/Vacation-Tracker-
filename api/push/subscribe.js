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

export default function handler(req, res) {
  if (req.method === 'POST') {
    const subscription = req.body;
    const userId = req.body.userId || 'anonymous';

    subscriptions.set(userId, subscription);

    res.status(201).json({
      success: true,
      message: 'Subscription saved',
      vapidPublicKey: vapidKeys.publicKey
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}