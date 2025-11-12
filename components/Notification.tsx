import React, { useEffect, useState } from 'react';
import { useVacationDispatch } from '../context/VacationContext';
import { Notification as NotificationType } from '../types';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import XIcon from './icons/XIcon';

interface NotificationProps {
  notification: NotificationType;
}

const Notification: React.FC<NotificationProps> = ({ notification }) => {
  const dispatch = useVacationDispatch();
  const [exiting, setExiting] = useState(false);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: { id: notification.id } });
    }, 300); // Match exit animation duration
  };
  
  useEffect(() => {
    const timer = setTimeout(handleDismiss, 5000);
    return () => clearTimeout(timer);
  }, []);

  const typeStyles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-500/20',
      icon: <CheckCircleIcon className="h-6 w-6 text-green-400" />,
      text: 'text-green-800 dark:text-green-200',
      closeHover: 'hover:bg-green-100 dark:hover:bg-green-500/30',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-500/20',
      icon: <XCircleIcon className="h-6 w-6 text-red-400" />,
      text: 'text-red-800 dark:text-red-200',
      closeHover: 'hover:bg-red-100 dark:hover:bg-red-500/30',
    },
  };
  
  const styles = typeStyles[notification.type];
  
  const animationClasses = exiting 
    ? 'transform ease-out duration-300 transition translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2'
    : 'transform ease-out duration-300 transition translate-y-0 opacity-100 sm:translate-x-0';


  return (
    <div
      className={`max-w-sm w-full ${styles.bg} shadow-lg rounded-lg pointer-events-auto ring-1 ring-black dark:ring-white ring-opacity-5 dark:ring-opacity-10 overflow-hidden ${animationClasses}`}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{styles.icon}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className={`text-sm font-medium ${styles.text}`}>{notification.message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleDismiss}
              className={`rounded-md inline-flex text-slate-400 dark:text-slate-300 ${styles.closeHover} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-1`}
              aria-label="Dismiss notification"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;
