import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const isNative = Capacitor.isNativePlatform();

export interface NotificationData {
  type?: string;
  title: string;
  body: string;
  userId?: string;
}

export const registerPushNotifications = async (): Promise<boolean> => {
  if (isNative) {
    return await registerNativePush();
  } else {
    return await registerWebPush();
  }
};

const registerNativePush = async (): Promise<boolean> => {
  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('Push notification permission denied');
      return false;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      await saveTokenToBackend(token.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received: ', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed', notification.actionId, notification.inputValue);
      handleNotificationAction(notification.actionId);
    });

    return true;
  } catch (error) {
    console.error('Error registering native push notifications:', error);
    return false;
  }
};

const registerWebPush = async (): Promise<boolean> => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Push notification permission denied');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    
    const response = await fetch(`${API_URL}/api/push/vapid-public-key`);
    const { publicKey } = await response.json();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    await saveWebPushSubscription(subscription);

    return true;
  } catch (error) {
    console.error('Error registering web push notifications:', error);
    return false;
  }
};

const saveTokenToBackend = async (token: string): Promise<void> => {
  try {
    const userId = localStorage.getItem('user_email') || 'anonymous';
    await fetch(`${API_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId, platform: 'mobile' })
    });
  } catch (error) {
    console.error('Error saving token to backend:', error);
  }
};

const saveWebPushSubscription = async (subscription: PushSubscription): Promise<void> => {
  try {
    const userId = localStorage.getItem('user_email') || 'anonymous';
    await fetch(`${API_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...subscription.toJSON(), userId, platform: 'web' })
    });
  } catch (error) {
    console.error('Error saving subscription to backend:', error);
  }
};

export const sendPushNotification = async (data: NotificationData): Promise<boolean> => {
  try {
    const userId = data.userId || localStorage.getItem('user_email') || 'anonymous';
    
    const response = await fetch(`${API_URL}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        type: data.type,
        title: data.title,
        body: data.body
      })
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

export const simulatePushNotification = async (type: string = 'general'): Promise<boolean> => {
  if (!isNative && 'serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({
      action: 'simulate-push',
      payload: { type }
    });
    return true;
  }
  return false;
};

const handleNotificationAction = (action: string) => {
  const params = new URLSearchParams(window.location.search);
  params.set('notification_action', action);
  window.location.search = params.toString();
};

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const unregisterPushNotifications = async (): Promise<void> => {
  if (isNative) {
    await PushNotifications.removeAllListeners();
  } else if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
  }
};
