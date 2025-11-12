import React from 'react';
import { useVacationState } from '../context/VacationContext';
import Notification from './Notification';

function NotificationCenter() {
  const { notifications } = useVacationState();

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex flex-col items-end px-4 py-6 pointer-events-none sm:p-6 z-50 space-y-4"
    >
      {notifications.map((notification) => (
        <Notification key={notification.id} notification={notification} />
      ))}
    </div>
  );
}

export default NotificationCenter;
