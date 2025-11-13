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
  };

type Action =
    | { type: 'ADD_REQUEST'; payload: VacationRequest }
    | { type: 'ADD_REQUEST_LOCAL'; payload: VacationRequest }
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
    | { type: 'SET_USERS'; payload: User[] }
    | { type: 'SET_REQUESTS'; payload: VacationRequest[] };
  
const users: User[] = [
    { name: 'Nikola Andrić', email: 'nikola@valens.dev', roles: ['Admin', 'Employee'], vacationDays: 25, paidLeaveDays: 7 },
    { name: 'Alice Smith', email: 'alice@company.com', roles: ['Project Manager', 'Employee'], vacationDays: 22, paidLeaveDays: 7 },
    { name: 'Bob Johnson', email: 'bob@company.com', roles: ['Employee'], vacationDays: 20, paidLeaveDays: 7 },
    { name: 'Charlie Brown', email: 'charlie@company.com', roles: ['Employee'], vacationDays: 15, paidLeaveDays: 7 },
    { name: 'Eva Martinez', email: 'eva@company.com', roles: ['CEO', 'Admin'], vacationDays: 30, paidLeaveDays: 10 },
];

const initialState: State = {
    timeEntries: [],
    notificationPermission: 'default',
    requests: [],
    notifications: [],
    isAdmin: false,
    editingRequest: null,
    users: [],
    currentUser: null,
    isLoggedIn: false,
    theme: 'light',
  };

const VacationStateContext = createContext<State | undefined>(undefined);
const VacationDispatchContext = createContext<Dispatch<Action> | undefined>(undefined);

function vacationReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_REQUEST_LOCAL':
      // Send Discord notification for new request
      (async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || '';
          const request = action.payload;

          const embed = {
            title: 'New Vacation Request',
            description: `${request.employeeName} submitted a ${request.type} request`,
            fields: [
              { name: 'Type', value: request.type, inline: true },
              { name: 'Days', value: request.days.toString(), inline: true },
              { name: 'Start Date', value: request.startDate.toLocaleDateString(), inline: true },
              { name: 'End Date', value: request.endDate.toLocaleDateString(), inline: true },
              { name: 'Status', value: request.status, inline: true },
            ],
            color: request.type === LeaveType.Vacation ? 0x00ff00 : request.type === LeaveType.SickLeave ? 0xff0000 : 0x0000ff,
            timestamp: new Date().toISOString(),
          };

          await fetch(`${API_URL}/api/discord/webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              embeds: [embed],
            }),
          });
        } catch (error) {
          console.error('Failed to send Discord notification:', error);
        }
      })();

      return {
        ...state,
        requests: [...state.requests, action.payload].sort((a,b) => a.startDate.getTime() - b.startDate.getTime()),
      };
    case 'ADD_REQUEST':
      // Call API to add request
      (async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || '';
          let request = action.payload;

          // Auto-approve sick leave
          if (request.type === LeaveType.SickLeave) {
            request = { ...request, status: VacationStatus.Approved };
          } else if (request.type === LeaveType.Vacation) {
            request = { ...request, status: VacationStatus.PendingPMAproval };
          } else if (request.type === LeaveType.PaidLeave) {
            request = { ...request, status: VacationStatus.PendingAdminApproval };
          }

          const response = await fetch(`${API_URL}/api/requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          });

          if (response.ok) {
            const newRequest = await response.json();
            // Convert dates
            newRequest.startDate = new Date(newRequest.startDate);
            newRequest.endDate = new Date(newRequest.endDate);

            // Dispatch to update state - need to use the dispatch from the outer scope
            // This will be fixed by the closure
          }
        } catch (error) {
          console.error('Error adding request:', error);
        }
      })();
      // Add the request locally immediately for better UX
      return {
        ...state,
        requests: [...state.requests, action.payload].sort((a,b) => a.startDate.getTime() - b.startDate.getTime()),
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
    case 'SET_USERS':
      return {
        ...state,
        users: action.payload,
      };
    case 'SET_REQUESTS':
      return {
        ...state,
        requests: action.payload,
      };
    default:
      return state;
  }
}

export function VacationProvider({ children }: { children: ReactNode }) {
   const [state, dispatch] = useReducer(vacationReducer, initialState);

   // Load from API on mount
   useEffect(() => {
     const loadData = async () => {
       try {
         const API_URL = import.meta.env.VITE_API_URL || '';

         // Load users
         const usersResponse = await fetch(`${API_URL}/api/users`);
         if (usersResponse.ok) {
           const users = await usersResponse.json();
           dispatch({ type: 'SET_USERS', payload: users });
         } else {
           // Fallback to hardcoded users if API fails
           console.log('[DEBUG] API failed to load users, using fallback users');
           dispatch({ type: 'SET_USERS', payload: users });
         }

         // Load requests
         const requestsResponse = await fetch(`${API_URL}/api/requests`);
         if (requestsResponse.ok) {
           const requests = await requestsResponse.json();
           // Convert date strings to Date objects
           const convertedRequests = requests.map((req: any) => ({
             ...req,
             startDate: new Date(req.startDate),
             endDate: new Date(req.endDate),
           }));
           dispatch({ type: 'SET_REQUESTS', payload: convertedRequests });
         }

         // Check for remembered user (use loaded users or fallback)
         const rememberedUser = localStorage.getItem('rememberedUser');
         if (rememberedUser) {
           const currentUsers = users; // Use the users variable from above
           const user = currentUsers.find((u: any) => u.name === rememberedUser);
           if (user) {
             dispatch({ type: 'LOGIN', payload: { userName: user.name } });
           }
         }
       } catch (error) {
         console.error('Failed to load data from API, using fallback users', error);
         // Fallback to hardcoded users if API completely fails
         dispatch({ type: 'SET_USERS', payload: users });
       }
     };

     loadData();
   }, []);

   // Request notification permission (browser notifications only)
   useEffect(() => {
     if ('Notification' in window) {
       dispatch({ type: 'SET_NOTIFICATION_PERMISSION', payload: Notification.permission });

       const requestPermission = async () => {
         if (Notification.permission === 'default') {
           const permission = await Notification.requestPermission();
           dispatch({ type: 'SET_NOTIFICATION_PERMISSION', payload: permission });
         }
       };

       requestPermission();
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
