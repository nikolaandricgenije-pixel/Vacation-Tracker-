import React, { useMemo, useState, useEffect } from 'react';
import { useVacationState, useVacationDispatch } from '../context/VacationContext';
import { VacationStatus, LeaveType, User } from '../types';
import Button from './ui/Button';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import BellIcon from './icons/BellIcon';
import SettingsIcon from './icons/SettingsIcon';


const AdminToggle = () => {
  const { isAdmin } = useVacationState();
  const dispatch = useVacationDispatch();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Admin View</span>
      <button
        onClick={() => dispatch({ type: 'TOGGLE_ADMIN_VIEW' })}
        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          isAdmin ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
        }`}
        role="switch"
        aria-checked={isAdmin}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
            isAdmin ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

const UserSwitcher = () => {
    const { users, currentUser } = useVacationState();
    const dispatch = useVacationDispatch();

    const handleSwitchUser = (e: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch({ type: 'SWITCH_USER', payload: { userName: e.target.value } });
    };

    return (
        <div>
            <label htmlFor="user-switcher" className="sr-only">Switch User</label>
            <select
                id="user-switcher"
                value={currentUser.name}
                onChange={handleSwitchUser}
                className="block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            >
                {users.map(user => (
                    <option key={user.name} value={user.name}>{user.name}</option>
                ))}
            </select>
        </div>
    );
};

const ThemeToggle = () => {
    const { theme } = useVacationState();
    const dispatch = useVacationDispatch();

    return (
        <button
            onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
    );
};


function Header() {
   const { requests, isAdmin, currentUser, notifications } = useVacationState();
   const dispatch = useVacationDispatch();
   const [notificationsOpen, setNotificationsOpen] = useState(false);
   const [settingsOpen, setSettingsOpen] = useState(false);
 
   const requestNotificationPermission = async () => {
     if ('Notification' in window) {
       const permission = await Notification.requestPermission();
       if (permission === 'granted') {
         // Register for push notifications
         if ('serviceWorker' in navigator && 'PushManager' in window) {
           const registration = await navigator.serviceWorker.ready;
           const subscription = await registration.pushManager.subscribe({
             userVisibleOnly: true,
             applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY') // Would need real VAPID key
           });
           console.log('Push subscription:', subscription);
           // In real app, send subscription to backend
         }
       }
     }
   };
 
   const urlBase64ToUint8Array = (base64String: string) => {
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

  const relevantRequests = isAdmin ? requests : requests.filter(r => r.employeeName === currentUser.name);

  const calculateApprovedDaysByType = (type: LeaveType) => {
    return relevantRequests
      .filter((req) => req.status === VacationStatus.Approved && req.type === type)
      .reduce((sum, req) => sum + req.days, 0);
  };

  const approvedVacationDays = useMemo(() => calculateApprovedDaysByType(LeaveType.Vacation), [relevantRequests]);
  const approvedPaidLeaveDays = useMemo(() => calculateApprovedDaysByType(LeaveType.PaidLeave), [relevantRequests]);
  const approvedSickDays = useMemo(() => calculateApprovedDaysByType(LeaveType.SickLeave), [relevantRequests]);

  const pendingDays = useMemo(() => {
    return relevantRequests
      .filter((req) => req.status === VacationStatus.Pending)
      .reduce((sum, req) => sum + req.days, 0);
  }, [relevantRequests]);

  const remainingDays = currentUser.vacationDays - approvedVacationDays;

  const StatCard: React.FC<{ label: string; value: number; color: string; darkColor?: string }> = ({ label, value, color, darkColor }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm text-center">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-3xl font-bold ${color} ${darkColor || ''}`}>{value}</p>
    </div>
  );

  return (
    <header className="relative">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
           <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Vacation Tracker</h1>
           <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Plan your time off with ease.</p>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">Logged in as: {currentUser.name}</span>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Notifications"
            >
              <BellIcon />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {notifications.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Settings"
            >
              <SettingsIcon />
            </button>
            <Button onClick={() => dispatch({ type: 'LOGOUT' })} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm">Logout</Button>
            {currentUser.roles.includes('Admin') && <AdminToggle />}
            <ThemeToggle />
        </div>
      </div>

      {notificationsOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className={`p-4 border-b border-slate-100 dark:border-slate-700 last:border-b-0 ${
                  notification.type === 'error' ? 'bg-red-50 dark:bg-red-500/10' :
                  notification.type === 'success' ? 'bg-green-50 dark:bg-green-500/10' :
                  'bg-blue-50 dark:bg-blue-500/10'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {notification.message}
                    </div>
                    <button
                      onClick={() => dispatch({ type: 'REMOVE_NOTIFICATION', payload: { id: notification.id } })}
                      className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      aria-label="Dismiss"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                onClick={() => dispatch({ type: 'REMOVE_NOTIFICATION', payload: { id: 'all' } })}
                className="w-full text-sm"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      )}

      {settingsOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Settings</h3>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Theme</label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Light</span>
                <ThemeToggle />
                <span className="text-sm text-slate-600 dark:text-slate-400">Dark</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notifications</label>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Manage your notification preferences</p>
              <div className="space-y-2">
                <Button
                  onClick={requestNotificationPermission}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Enable Push Notifications
                </Button>
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      if ('Notification' in window) {
                        new Notification('⏰ Vacation Tracker', {
                          body: 'Regular notification test - actions work only with push notifications',
                          icon: '/icon-192.png'
                        });
                      }
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Test Regular Notification
                  </Button>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    💡 Push notification actions work only with real push events from server
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Account</label>
              <p className="text-sm text-slate-600 dark:text-slate-400">Logged in as {currentUser.name}</p>
            </div>
          </div>
        </div>
      )}

      <div className={`mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 ${isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-6'}`}>
        {!isAdmin && <StatCard label="Total Vacation" value={currentUser.vacationDays} color="text-slate-700" darkColor="dark:text-slate-200" />}
        <StatCard label="Approved Vacation" value={approvedVacationDays} color="text-green-600" darkColor="dark:text-green-500" />
        <StatCard label="Paid Leave" value={approvedPaidLeaveDays} color="text-purple-600" darkColor="dark:text-purple-500" />
        <StatCard label="Sick Leave" value={approvedSickDays} color="text-orange-600" darkColor="dark:text-orange-500" />
        <StatCard label="Pending" value={pendingDays} color="text-amber-600" darkColor="dark:text-amber-500" />
        {!isAdmin && <StatCard label="Remaining" value={remainingDays} color="text-blue-600" darkColor="dark:text-blue-500" />}
      </div>
    </header>
  );
}

export default Header;