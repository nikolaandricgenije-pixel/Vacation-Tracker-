// Service Worker for Vacation Tracker PWA
const CACHE_NAME = 'vacation-tracker-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const currentHour = new Date().getHours();

  let title = '⏰ Vacation Tracker';
  let body = 'Time to manage your workday!';
  let actions = [];

  // Contextual notifications based on time and data
  if (data.type === 'morning') {
    title = '🌅 Good Morning!';
    body = 'Ready to start your workday? Clock in to begin tracking your time.';
    actions = [
      { action: 'clock-in-office', title: '🏢 Clock In (Office)', icon: '/icon-192.png' },
      { action: 'clock-in-home', title: '🏠 Clock In (Home)', icon: '/icon-192.png' }
    ];
  } else if (data.type === 'lunch') {
    title = '🍽️ Lunch Break';
    body = 'Time for a break! Don\'t forget to clock out for lunch.';
    actions = [
      { action: 'start-break', title: '☕ Start Break', icon: '/icon-192.png' },
      { action: 'start-off', title: '⏸️ Start Off', icon: '/icon-192.png' }
    ];
  } else if (data.type === 'end-of-day') {
    title = '🏠 End of Day';
    body = 'Your workday is coming to a close. Ready to clock out?';
    actions = [
      { action: 'clock-out', title: '🔴 Clock Out', icon: '/icon-192.png' },
      { action: 'start-off', title: '⏸️ Start Off', icon: '/icon-192.png' }
    ];
  } else {
    // Default contextual actions based on time
    if (currentHour >= 6 && currentHour <= 10) {
      title = '🌅 Start Your Day';
      body = 'Begin your workday by clocking in.';
      actions = [
        { action: 'clock-in-office', title: '🏢 Office', icon: '/icon-192.png' },
        { action: 'clock-in-home', title: '🏠 Home', icon: '/icon-192.png' }
      ];
    } else if (currentHour >= 11 && currentHour <= 14) {
      title = '🍽️ Midday Break';
      body = 'Take a break or lunch. Your time is being tracked!';
      actions = [
        { action: 'start-break', title: '☕ Break', icon: '/icon-192.png' },
        { action: 'start-off', title: '⏸️ Off Duty', icon: '/icon-192.png' }
      ];
    } else if (currentHour >= 15 && currentHour <= 18) {
      title = '🏠 Wrap Up Your Day';
      body = 'Time to clock out and end your workday.';
      actions = [
        { action: 'clock-out', title: '🔴 Clock Out', icon: '/icon-192.png' },
        { action: 'start-break', title: '☕ Quick Break', icon: '/icon-192.png' }
      ];
    } else {
      title = '⏰ Time Management';
      body = 'Manage your work time and breaks efficiently.';
      actions = [
        { action: 'clock-in-office', title: '🏢 Clock In', icon: '/icon-192.png' },
        { action: 'clock-out', title: '🔴 Clock Out', icon: '/icon-192.png' },
        { action: 'start-break', title: '☕ Break', icon: '/icon-192.png' },
        { action: 'start-off', title: '⏸️ Off', icon: '/icon-192.png' }
      ];
    }
  }

  const options = {
    body: body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.type || 'time-management',
    requireInteraction: false,
    silent: false,
    data: {
      dateOfArrival: Date.now(),
      type: data.type || 'general',
      primaryKey: 1
    },
    actions: actions
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Open the app with action parameter
  let url = '/';
  if (event.action) {
    url += `?action=${event.action}`;
  }

  clients.openWindow(url);
});

// Message event for simulating push notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'simulate-push') {
    const data = event.data.payload;
    // Simulate push event
    self.dispatchEvent(new PushEvent('push', {
      data: {
        json: () => data,
      },
    }));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline actions when back online
  console.log('Background sync triggered');
}