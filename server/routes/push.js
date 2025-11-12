const express = require('express');
const webPush = require('web-push');

const router = express.Router();

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

router.post('/subscribe', (req, res) => {
  const subscription = req.body;
  const userId = req.body.userId || 'anonymous';
  
  subscriptions.set(userId, subscription);
  
  res.status(201).json({ 
    success: true, 
    message: 'Subscription saved',
    vapidPublicKey: vapidKeys.publicKey
  });
});

router.post('/unsubscribe', (req, res) => {
  const { userId } = req.body;
  
  if (subscriptions.has(userId)) {
    subscriptions.delete(userId);
    res.json({ success: true, message: 'Unsubscribed successfully' });
  } else {
    res.status(404).json({ success: false, message: 'Subscription not found' });
  }
});

router.post('/send', async (req, res) => {
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
});

router.post('/broadcast', async (req, res) => {
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
});

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

module.exports = router;
