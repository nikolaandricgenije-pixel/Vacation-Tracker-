import React, { createContext, useReducer, useContext, useEffect, Dispatch, ReactNode } from 'react';
import { VacationRequest, VacationStatus, LeaveType, User, WorkType, TimeEntry } from '../types';
import type { Notification as AppNotification } from '../types';
import { addDays, differenceInMinutes, startOfDay, format } from 'date-fns';

type State = {
    requests: VacationRequest[];
    notifications: AppNotification[];
    isAdmin: boolean;
    editingRequest: VacationRequest | null;
    users: User[];
    currentUser: User | null;
    isLoggedIn: boolean;
    theme: 'light' | 'dark';
    timeEntries: TimeEntry[];
    notificationPermission: NotificationPermission;
    pushSubscription: PushSubscription | null;
  };

type Action =
    | { type: 'ADD_REQUEST'; payload: VacationRequest }
    | { type: 'APPROVE_REQUEST'; payload: { id: string; newStatus?: VacationStatus } }
    | { type: 'REJECT_REQUEST'; payload: { id: string } }
    | { type: 'ADD_NOTIFICATION'; payload: AppNotification }
    | { type: 'REMOVE_NOTIFICATION'; payload: { id: string } }
    | { type: 'TOGGLE_ADMIN_VIEW' }
    | { type: 'START_EDIT'; payload: { id: string } }
    | { type: 'CANCEL_EDIT' }
    | { type: 'UPDATE_REQUEST'; payload: VacationRequest }
    | { type: 'DELETE_REQUEST'; payload: { id: string } }
    | { type: 'SWITCH_USER'; payload: { userName: string } }
    | { type: 'ADD_USER'; payload: User }
    | { type: 'TOGGLE_THEME' }
    | { type: 'CLOCK_IN'; payload: { workType: WorkType } }
    | { type: 'CLOCK_OUT' }
    | { type: 'START_BREAK' }
    | { type: 'END_BREAK' }
    | { type: 'START_OFF' }
    | { type: 'END_OFF' }
    | { type: 'ADD_BUSINESS_TRIP'; payload: { date: Date } }
    | { type: 'LOGIN'; payload: { userName: string } }
    | { type: 'LOGOUT' }
    | { type: 'LOAD_STATE'; payload: State }
    | { type: 'RESET_DAILY_ENTRIES' }
    | { type: 'SET_NOTIFICATION_PERMISSION'; payload: NotificationPermission }
    | { type: 'SET_PUSH_SUBSCRIPTION'; payload: PushSubscription | null };
  
const users: User[] = [
    { name: 'Nikola Andrić', roles: ['Admin', 'Employee'], vacationDays: 25, paidLeaveDays: 7 },
    { name: 'Alice Smith', roles: ['Project Manager', 'Employee'], vacationDays: 22, paidLeaveDays: 7 },
    { name: 'Bob Johnson', roles: ['Employee'], vacationDays: 20, paidLeaveDays: 7 },
    { name: 'Charlie Brown', roles: ['Employee'], vacationDays: 15, paidLeaveDays: 7 },
    { name: 'Eva Martinez', roles: ['CEO', 'Admin'], vacationDays: 30, paidLeaveDays: 10 },
];

const today = new Date();
const initialState: State = {
    timeEntries: [],
    notificationPermission: 'default',
    pushSubscription: null,
    requests: [
     {
       id: '1',
       employeeName: 'Nikola Andrić',
       startDate: addDays(today, 10),
       endDate: addDays(today, 14),
       days: 5,
       status: VacationStatus.Approved,
       type: LeaveType.Vacation,
       notes: 'Family trip to the mountains.',
     },
     {
       id: '2',
       employeeName: 'Nikola Andrić',
       startDate: addDays(today, -20),
       endDate: addDays(today, -18),
       days: 3,
       status: VacationStatus.Approved,
       type: LeaveType.Vacation,
     },
     {
       id: '3',
       employeeName: 'Nikola Andrić',
       startDate: addDays(today, 30),
       endDate: addDays(today, 31),
       days: 2,
       status: VacationStatus.Pending,
       type: LeaveType.Vacation,
       notes: 'Short break for a personal appointment.',
     },
      {
       id: '4',
       employeeName: 'Nikola Andrić',
       startDate: addDays(today, -50),
       endDate: addDays(today, -49),
       days: 2,
       status: VacationStatus.Rejected,
       type: LeaveType.Vacation,
     },
     {
       id: '5',
       employeeName: 'Nikola Andrić',
       startDate: addDays(today, 11),
       endDate: addDays(today, 12),
       days: 2,
       status: VacationStatus.Approved,
       type: LeaveType.PaidLeave,
     },
     {
       id: '6',
       employeeName: 'Nikola Andrić',
       startDate: addDays(today, 55),
       endDate: addDays(today, 55),
       days: 1,
       status: VacationStatus.Approved,
       type: LeaveType.SickLeave,
       notes: 'Feeling unwell.',
     },
   ],
   notifications: [],
   isAdmin: false,
   editingRequest: null,
   users,
   currentUser: null,
   isLoggedIn: false,
   theme: 'light',
 };

const VacationStateContext = createContext<State | undefined>(undefined);
const VacationDispatchContext = createContext<Dispatch<Action> | undefined>(undefined);

function vacationReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_REQUEST':
      let request = action.payload;

      // Auto-approve sick leave
      if (request.type === LeaveType.SickLeave) {
        request = { ...request, status: VacationStatus.Approved };

        // Add notification for auto-approved sick leave
        const autoApproveNotification: AppNotification = {
          id: new Date().toISOString(),
          type: 'success',
          message: (
            <div>
              <strong>🤒 Sick Leave Auto-Approved</strong>
              <br />
              Your sick leave request has been automatically approved.
            </div>
          ),
        };

        return {
          ...state,
          requests: [...state.requests, request].sort((a,b) => a.startDate.getTime() - b.startDate.getTime()),
          notifications: [...state.notifications, autoApproveNotification],
        };
      }

      // Set initial status based on leave type
      if (request.type === LeaveType.Vacation) {
        request = { ...request, status: VacationStatus.PendingPMAproval };
      } else if (request.type === LeaveType.PaidLeave) {
        request = { ...request, status: VacationStatus.PendingAdminApproval };
      }

      return {
        ...state,
        requests: [...state.requests, request].sort((a,b) => a.startDate.getTime() - b.startDate.getTime()),
      };
    case 'APPROVE_REQUEST':
      const newStatus = action.payload.newStatus || VacationStatus.Approved;
      return {
        ...state,
        requests: state.requests.map((req) =>
          req.id === action.payload.id
            ? { ...req, status: newStatus }
            : req
        ),
      };
    case 'REJECT_REQUEST':
      return {
        ...state,
        requests: state.requests.map((req) =>
          req.id === action.payload.id
            ? { ...req, status: VacationStatus.Rejected }
            : req
        ),
      };
    case 'ADD_NOTIFICATION':
      // Show browser notification if permission granted
      if (state.notificationPermission === 'granted' && 'Notification' in window) {
        const notification = new Notification('Vacation Tracker', {
          body: action.payload.message.toString().replace(/<[^>]*>/g, ''), // Strip HTML
          icon: '/icon-192.png', // Assuming icon exists
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case 'REMOVE_NOTIFICATION':
      if (action.payload.id === 'all') {
        return {
          ...state,
          notifications: [],
        };
      }
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload.id
        ),
      };
    case 'TOGGLE_ADMIN_VIEW':
      return {
        ...state,
        isAdmin: !state.isAdmin,
        editingRequest: null, // Cancel edits when switching views
      };
    case 'START_EDIT':
      return {
        ...state,
        editingRequest: state.requests.find(r => r.id === action.payload.id) || null,
      };
    case 'CANCEL_EDIT':
      return {
        ...state,
        editingRequest: null,
      };
    case 'UPDATE_REQUEST':
      return {
        ...state,
        requests: state.requests.map(r => r.id === action.payload.id ? action.payload : r).sort((a,b) => a.startDate.getTime() - b.startDate.getTime()),
        editingRequest: null,
      };
    case 'DELETE_REQUEST':
        return {
            ...state,
            requests: state.requests.filter(r => r.id !== action.payload.id),
        };
    case 'SWITCH_USER': {
        const newUser = state.users.find(u => u.name === action.payload.userName) || state.currentUser;
        return {
            ...state,
            currentUser: newUser,
            isAdmin: false, // Reset admin view on user switch
            editingRequest: null, // Cancel edits on user switch
        }
    }
    case 'ADD_USER':
        return {
            ...state,
            users: [...state.users, action.payload],
        };
    case 'TOGGLE_THEME':
        return {
            ...state,
            theme: state.theme === 'light' ? 'dark' : 'light',
        }
    case 'CLOCK_IN': {
      if (!state.currentUser) return state;
      const now = new Date();
      // Security: Check time synchronization (in real app, compare with server time)
      const clientTime = now.getTime();
      const expectedTime = Date.now();
      if (Math.abs(clientTime - expectedTime) > 300000) { // 5 minute tolerance
        console.warn('Security: Time synchronization issue detected - potential time manipulation');
        // In real app, this would trigger server validation
        return state;
      }
      const today = startOfDay(new Date());
      const existing = state.timeEntries.find(e => e.employeeName === state.currentUser.name && e.date.getTime() === today.getTime());
      if (existing) {
        // Update existing - allow clock in again if not already clocked in
        if (!existing.isClockedIn) {
          return {
            ...state,
            timeEntries: state.timeEntries.map(e => e.id === existing.id ? { ...e, lastClockIn: now, isClockedIn: true, workType: action.payload.workType } : e)
          };
        }
      } else {
        // Create new
        const newEntry: TimeEntry = {
          id: new Date().toISOString(),
          employeeName: state.currentUser.name,
          date: today,
          workType: action.payload.workType,
          lastClockIn: now,
          isClockedIn: true,
          breaks: [],
          offs: [],
          totalWorkingMinutes: 0,
        };
        return {
          ...state,
          timeEntries: [...state.timeEntries, newEntry],
        };
      }
      return state;
    }
    case 'CLOCK_OUT': {
      if (!state.currentUser) return state;
      const today = startOfDay(new Date());
      const existing = state.timeEntries.find(e => e.employeeName === state.currentUser.name && e.date.getTime() === today.getTime());
      if (existing && existing.isClockedIn && existing.lastClockIn) {
        const clockOut = new Date();
        const sessionMinutes = differenceInMinutes(clockOut, existing.lastClockIn);
        const offMinutes = existing.offs.reduce((sum, off) => {
          if (off.end) {
            return sum + differenceInMinutes(off.end, off.start);
          }
          return sum;
        }, 0);
        const workingMinutes = sessionMinutes - offMinutes;
        return {
          ...state,
          timeEntries: state.timeEntries.map(e => e.id === existing.id ? { ...e, isClockedIn: false, totalWorkingMinutes: existing.totalWorkingMinutes + workingMinutes } : e)
        };
      }
      return state;
    }
    case 'START_BREAK': {
      if (!state.currentUser) return state;
      const today = startOfDay(new Date());
      const existing = state.timeEntries.find(e => e.employeeName === state.currentUser.name && e.date.getTime() === today.getTime());
      if (existing) {
        return {
          ...state,
          timeEntries: state.timeEntries.map(e => e.id === existing.id ? { ...e, breaks: [...e.breaks, { start: new Date() }] } : e)
        };
      }
      return state;
    }
    case 'END_BREAK': {
      if (!state.currentUser) return state;
      const today = startOfDay(new Date());
      const existing = state.timeEntries.find(e => e.employeeName === state.currentUser.name && e.date.getTime() === today.getTime());
      if (existing) {
        const breaks = [...existing.breaks];
        const lastBreak = breaks[breaks.length - 1];
        if (lastBreak && !lastBreak.end) {
          lastBreak.end = new Date();
        }
        return {
          ...state,
          timeEntries: state.timeEntries.map(e => e.id === existing.id ? { ...e, breaks } : e)
        };
      }
      return state;
    }
    case 'START_OFF': {
      if (!state.currentUser) return state;
      const today = startOfDay(new Date());
      const existing = state.timeEntries.find(e => e.employeeName === state.currentUser.name && e.date.getTime() === today.getTime());
      if (existing) {
        return {
          ...state,
          timeEntries: state.timeEntries.map(e => e.id === existing.id ? { ...e, offs: [...e.offs, { start: new Date() }] } : e)
        };
      }
      return state;
    }
    case 'END_OFF': {
      if (!state.currentUser) return state;
      const today = startOfDay(new Date());
      const existing = state.timeEntries.find(e => e.employeeName === state.currentUser.name && e.date.getTime() === today.getTime());
      if (existing) {
        const offs = [...existing.offs];
        const lastOff = offs[offs.length - 1];
        if (lastOff && !lastOff.end) {
          lastOff.end = new Date();
        }
        return {
          ...state,
          timeEntries: state.timeEntries.map(e => e.id === existing.id ? { ...e, offs } : e)
        };
      }
      return state;
    }
    case 'ADD_BUSINESS_TRIP': {
      if (!state.currentUser) return state;
      const today = startOfDay(action.payload.date);
      const existing = state.timeEntries.find(e => e.employeeName === state.currentUser.name && e.date.getTime() === today.getTime());
      if (!existing) {
        const newEntry: TimeEntry = {
          id: new Date().toISOString(),
          employeeName: state.currentUser.name,
          date: today,
          workType: WorkType.BusinessTrip,
          isClockedIn: false,
          breaks: [],
          offs: [],
          totalWorkingMinutes: 480, // 8 hours
        };
        return {
          ...state,
          timeEntries: [...state.timeEntries, newEntry],
        };
      }
      return state;
    }
    case 'LOGIN': {
      const user = state.users.find(u => u.name === action.payload.userName);
      if (user) {
        // Remember user for auto-login
        localStorage.setItem('rememberedUser', user.name);
        return {
          ...state,
          currentUser: user,
          isLoggedIn: true,
          isAdmin: false, // Reset admin view on login
          editingRequest: null, // Cancel edits on login
        };
      }
      return state;
    }
    case 'LOGOUT': {
      // Clear remembered user
      localStorage.removeItem('rememberedUser');
      return {
        ...state,
        currentUser: null,
        isLoggedIn: false,
        isAdmin: false,
        editingRequest: null,
      };
    }
    case 'LOAD_STATE': {
      return action.payload;
    }
    case 'RESET_DAILY_ENTRIES': {
      const today = startOfDay(new Date());
      return {
        ...state,
        timeEntries: state.timeEntries.filter(e => e.date.getTime() !== today.getTime()),
      };
    }
    case 'SET_NOTIFICATION_PERMISSION':
      return {
        ...state,
        notificationPermission: action.payload,
      };
    case 'SET_PUSH_SUBSCRIPTION':
      return {
        ...state,
        pushSubscription: action.payload,
      };
    default:
      return state;
  }
}

export function VacationProvider({ children }: { children: ReactNode }) {
   const [state, dispatch] = useReducer(vacationReducer, initialState);

   // Load from localStorage on mount
   useEffect(() => {
     const saved = localStorage.getItem('vacationTrackerState');
     let hasCurrentUser = false;

     if (saved) {
       try {
         const parsed = JSON.parse(saved);
         hasCurrentUser = !!parsed.currentUser;
         // Convert date strings back to Date objects
         parsed.requests = parsed.requests.map((req: any) => ({
           ...req,
           startDate: new Date(req.startDate),
           endDate: new Date(req.endDate),
         }));
         parsed.timeEntries = parsed.timeEntries.map((entry: any) => ({
           ...entry,
           date: new Date(entry.date),
           lastClockIn: entry.lastClockIn ? new Date(entry.lastClockIn) : undefined,
           breaks: entry.breaks.map((b: any) => ({
             start: new Date(b.start),
             end: b.end ? new Date(b.end) : undefined,
           })),
           offs: entry.offs.map((o: any) => ({
             start: new Date(o.start),
             end: o.end ? new Date(o.end) : undefined,
           })),
         }));
         // Merge with initial state to avoid missing keys
         dispatch({ type: 'LOAD_STATE', payload: parsed });
       } catch (e) {
         console.error('Failed to load state from localStorage', e);
       }
     }

     // Check for remembered user and auto-login if no current user
     if (!hasCurrentUser) {
       const rememberedUser = localStorage.getItem('rememberedUser');
       if (rememberedUser) {
         const user = state.users.find(u => u.name === rememberedUser);
         if (user) {
           dispatch({ type: 'LOGIN', payload: { userName: user.name } });
         }
       }
     }
   }, []);

   // Request notification permission and subscribe to push notifications
   useEffect(() => {
     if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
       dispatch({ type: 'SET_NOTIFICATION_PERMISSION', payload: Notification.permission });

       const setupNotifications = async () => {
         // Request permission if not granted
         let permission = Notification.permission;
         if (permission === 'default') {
           permission = await Notification.requestPermission();
           dispatch({ type: 'SET_NOTIFICATION_PERMISSION', payload: permission });
         }

         if (permission === 'granted') {
           try {
             const registration = await navigator.serviceWorker.ready;
             const existingSubscription = await registration.pushManager.getSubscription();

             if (!existingSubscription) {
               // Fetch VAPID public key from backend
               const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
               const response = await fetch(`${API_URL}/api/push/vapid-public-key`);
               const { publicKey } = await response.json();

               // Subscribe to push notifications
               const subscription = await registration.pushManager.subscribe({
                 userVisibleOnly: true,
                 applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource
               });
               dispatch({ type: 'SET_PUSH_SUBSCRIPTION', payload: subscription });
               console.log('Push subscription created:', subscription);
             } else {
               dispatch({ type: 'SET_PUSH_SUBSCRIPTION', payload: existingSubscription });
               console.log('Existing push subscription found:', existingSubscription);
             }
           } catch (error) {
             console.error('Error setting up push notifications:', error);
           }
         }
       };

       setupNotifications();
     }
   }, []);

   // Save to localStorage on state change
   useEffect(() => {
     localStorage.setItem('vacationTrackerState', JSON.stringify(state));
   }, [state]);

   // Auto-reset daily entries at midnight
   useEffect(() => {
     const checkMidnight = () => {
       const now = new Date();
       if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
         // Archive yesterday's entries and reset for new day
         const yesterday = new Date(now);
         yesterday.setDate(yesterday.getDate() - 1);
         const yesterdayKey = `archived-${format(yesterday, 'yyyy-MM-dd')}`;

         const yesterdayEntries = state.timeEntries.filter(e =>
           e.date.toDateString() === yesterday.toDateString()
         );

         if (yesterdayEntries.length > 0) {
           const archived = JSON.parse(localStorage.getItem(yesterdayKey) || '[]');
           archived.push(...yesterdayEntries);
           localStorage.setItem(yesterdayKey, JSON.stringify(archived));
         }

         // Reset today's entries
         dispatch({ type: 'RESET_DAILY_ENTRIES' });
       }
     };

     const interval = setInterval(checkMidnight, 1000);
     return () => clearInterval(interval);
   }, [state.timeEntries, dispatch]);

   return (
     <VacationStateContext.Provider value={state}>
       <VacationDispatchContext.Provider value={dispatch}>
         {children}
       </VacationDispatchContext.Provider>
     </VacationStateContext.Provider>
   );
 }

export function useVacationState() {
  const context = useContext(VacationStateContext);
  if (context === undefined) {
    throw new Error('useVacationState must be used within a VacationProvider');
  }
  return context;
}

export function useVacationDispatch() {
   const context = useContext(VacationDispatchContext);
   if (context === undefined) {
     throw new Error('useVacationDispatch must be used within a VacationProvider');
   }
   return context;
 }

// Helper function to convert VAPID key
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

// Function to send push notification (for testing/simulating)
export async function sendPushNotification(type: string, data: any = {}) {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // For localhost/development, we can simulate push by calling the service worker directly
        // In production, this would be sent to your server which would then push to the subscription
        const message = {
          type,
          ...data,
        };

        // Simulate push by posting message to service worker
        registration.active?.postMessage({
          action: 'simulate-push',
          payload: message,
        });

        console.log('Push notification simulated:', message);
        return true;
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
  return false;
}
