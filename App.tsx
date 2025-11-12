import React, { useEffect, useState } from 'react';
import { VacationProvider, useVacationState, useVacationDispatch } from './context/VacationContext';
import Header from './components/Header';
import CalendarView from './components/CalendarView';
import VacationRequestForm from './components/VacationRequestForm';
import VacationList from './components/VacationList';
import Card from './components/ui/Card';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import UserManagement from './components/UserManagement';
import TimeTracker from './components/TimeTracker';
import Login from './components/Login';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import QuickActions from './components/QuickActions';
import ClockWidget from './components/ClockWidget';
import { WorkType } from './types';

import { registerPushNotifications } from './utils/pushNotifications';

function NotificationActionHandler() {
   const dispatch = useVacationDispatch();

   useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');

      if (action) {
         // Clear the URL parameter
         const newUrl = window.location.pathname;
         window.history.replaceState({}, '', newUrl);

         // Perform the action
         switch (action) {
            case 'clock-in-office':
               dispatch({ type: 'CLOCK_IN', payload: { workType: WorkType.Office } });
               break;
            case 'clock-in-home':
               dispatch({ type: 'CLOCK_IN', payload: { workType: WorkType.Home } });
               break;
            case 'clock-out':
               dispatch({ type: 'CLOCK_OUT' });
               break;
            case 'start-break':
               dispatch({ type: 'START_BREAK' });
               break;
            case 'end-break':
               dispatch({ type: 'END_BREAK' });
               break;
            case 'start-off':
               dispatch({ type: 'START_OFF' });
               break;
            case 'end-off':
               dispatch({ type: 'END_OFF' });
               break;
         }
      }
   }, [dispatch]);

   return null;
}

function MonthlyOvertimeNotifier() {
   const { timeEntries, currentUser, notifications } = useVacationState();
   const dispatch = useVacationDispatch();

   useEffect(() => {
      if (!currentUser) return;

      const now = new Date();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const isLastDayOfMonth = now.toDateString() === lastDayOfMonth.toDateString();

      // Only notify on the last day of the month and if we haven't notified this month yet
      const notificationKey = `overtime-${now.getFullYear()}-${now.getMonth()}`;
      const alreadyNotified = notifications.some(n =>
         n.message?.toString().includes(notificationKey)
      );

      if (isLastDayOfMonth && !alreadyNotified) {
         // Calculate monthly overtime
         const userEntries = timeEntries.filter(e => e.employeeName === currentUser.name);
         const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
         const monthEntries = userEntries.filter(e => e.date >= monthStart);

         // Group by weeks and calculate overtime
         const weeks = {};
         monthEntries.forEach(entry => {
            const weekStart = new Date(entry.date);
            weekStart.setDate(entry.date.getDate() - entry.date.getDay() + 1);
            const weekKey = weekStart.toISOString().split('T')[0];

            if (!weeks[weekKey]) weeks[weekKey] = [];
            weeks[weekKey].push(entry);
         });

         let overtimeHours = 0;
         Object.values(weeks).forEach((weekEntries: any[]) => {
            const weeklyTotal = weekEntries.reduce((sum, e) => sum + e.totalWorkingMinutes, 0) / 60;
            if (weeklyTotal > 40) {
               overtimeHours += weeklyTotal - 40;
            }
         });

         if (overtimeHours > 0) {
            dispatch({
               type: 'ADD_NOTIFICATION',
               payload: {
                  id: new Date().toISOString(),
                  type: 'success',
                  message: (
                     <div>
                        <strong>🏆 Monthly Overtime Summary</strong>
                        <br />
                        You have <strong>{overtimeHours.toFixed(1)} overtime hours</strong> this month.
                        <br />
                        <small>Key: {notificationKey}</small>
                     </div>
                  ),
               }
            });
         }
      }
   }, [currentUser, timeEntries, notifications, dispatch]);

   return null;
}

function WelcomeOnboarding() {
   const { currentUser } = useVacationState();
   const [showWelcome, setShowWelcome] = useState(true);

   useEffect(() => {
      if (currentUser) {
         const hasSeenWelcome = localStorage.getItem(`welcome-${currentUser.name}`);
         if (hasSeenWelcome) {
            setShowWelcome(false);
         }
      }
   }, [currentUser]);

   const dismissWelcome = () => {
      if (currentUser) {
         localStorage.setItem(`welcome-${currentUser.name}`, 'true');
      }
      setShowWelcome(false);
   };

   if (!showWelcome || !currentUser) return null;

   return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
         <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="text-center mb-6">
               <div className="text-6xl mb-4">🎉</div>
               <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Welcome to Vacation Tracker!
               </h2>
               <p className="text-slate-600 dark:text-slate-400">
                  Let's get you started with time tracking
               </p>
            </div>

            <div className="space-y-4 mb-6">
               <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                  <div className="text-blue-500 mt-1">🕒</div>
                  <div>
                     <h4 className="font-semibold text-slate-800 dark:text-slate-200">Clock In/Out</h4>
                     <p className="text-sm text-slate-600 dark:text-slate-400">Start your workday and track your hours</p>
                  </div>
               </div>

               <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-500/10 rounded-lg">
                  <div className="text-green-500 mt-1">🏖️</div>
                  <div>
                     <h4 className="font-semibold text-slate-800 dark:text-slate-200">Request Time Off</h4>
                     <p className="text-sm text-slate-600 dark:text-slate-400">Plan your vacations and time off</p>
                  </div>
               </div>

               <div className="flex items-start space-x-3 p-3 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
                  <div className="text-purple-500 mt-1">📊</div>
                  <div>
                     <h4 className="font-semibold text-slate-800 dark:text-slate-200">Track Progress</h4>
                     <p className="text-sm text-slate-600 dark:text-slate-400">Monitor your hours and overtime</p>
                  </div>
               </div>
            </div>

            <button
               onClick={dismissWelcome}
               className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
            >
               Get Started! 🚀
            </button>
         </div>
      </div>
   );
}

function AppContent() {
   const { isAdmin, theme, isLoggedIn, currentUser } = useVacationState();

   const dispatch = useVacationDispatch();
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    body.classList.remove('bg-slate-50', 'text-slate-800', 'bg-slate-900', 'text-slate-200');
    if (theme === 'dark') {
      body.classList.add('bg-slate-900', 'text-slate-200');
    } else {
      body.classList.add('bg-slate-50', 'text-slate-800');
    }

  }, [theme]);



  if (!isLoggedIn || !currentUser) {
    return <Login />;
  }

  return (
    <>
      <NotificationActionHandler />
      <MonthlyOvertimeNotifier />
      <WelcomeOnboarding />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
          <Header />

          {!isAdmin && (
            <div className="mt-8 space-y-8">
              {/* Primary Actions - Clock Widget */}
              <section aria-labelledby="time-tracking">
                <h2 id="time-tracking" className="sr-only">Time Tracking</h2>
                <ClockWidget />
              </section>

              {/* Quick Actions */}
              <section aria-labelledby="quick-actions">
                <h2 id="quick-actions" className="sr-only">Quick Actions</h2>
                <QuickActions />
              </section>
            </div>
          )}

          <main className="mt-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Main Content Area */}
            <div className="xl:col-span-8 space-y-8">
              {/* Calendar Overview */}
              <section aria-labelledby="calendar-overview">
                <h2 id="calendar-overview" className="sr-only">Calendar Overview</h2>
                <Card className="shadow-lg">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                        <span className="mr-2">📅</span>
                        Calendar Overview
                      </h3>
                      <span className="text-sm text-slate-500 dark:text-slate-400">Plan your time</span>
                    </div>
                    <CalendarView />
                  </div>
                </Card>
              </section>

              {!isAdmin && (
                <>
                  {/* Time Off Requests */}
                  <section aria-labelledby="time-off-requests">
                    <Card className="shadow-lg">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                            <span className="mr-2">🏖️</span>
                            Request Time Off
                          </h3>
                          <span className="text-sm text-slate-500 dark:text-slate-400">Plan your vacation</span>
                        </div>
                        <VacationRequestForm />
                      </div>
                    </Card>
                  </section>

                  {/* Time Tracking Stats */}
                  <section aria-labelledby="time-tracking-stats">
                    <Card className="shadow-lg">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                            <span className="mr-2">📊</span>
                            Time Tracking Summary
                          </h3>
                          <span className="text-sm text-slate-500 dark:text-slate-400">Your hours overview</span>
                        </div>
                        <TimeTracker />
                      </div>
                    </Card>
                  </section>
                </>
              )}

              {isAdmin && (
                <>
                  {/* Analytics Dashboard */}
                  <section aria-labelledby="analytics-dashboard">
                    <Card className="shadow-lg">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                            <span className="mr-2">📈</span>
                            Team Analytics
                          </h3>
                          <span className="text-sm text-slate-500 dark:text-slate-400">Performance insights</span>
                        </div>
                        <AnalyticsDashboard />
                      </div>
                    </Card>
                  </section>

                  {/* User Management */}
                  <section aria-labelledby="user-management">
                    <Card className="shadow-lg">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                            <span className="mr-2">👥</span>
                            User Management
                          </h3>
                          <span className="text-sm text-slate-500 dark:text-slate-400">Manage team members</span>
                        </div>
                        <UserManagement />
                      </div>
                    </Card>
                  </section>
                </>
              )}
            </div>

            {/* Sidebar */}
            <aside className="xl:col-span-4 space-y-8">
              {/* Vacation List */}
              <section aria-labelledby="vacation-list">
                <Card className="shadow-lg sticky top-8">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                        <span className="mr-2">📋</span>
                        {isAdmin ? 'All Requests' : 'My Requests'}
                      </h3>
                      <span className="text-sm text-slate-500 dark:text-slate-400">Track status</span>
                    </div>
                    <VacationList />
                  </div>
                </Card>
              </section>
            </aside>
          </main>
        </div>
      </div>
      <PWAInstallPrompt />
    </>
  );
}


function App() {
  return (
    <VacationProvider>
      <AppContent />
    </VacationProvider>
  );
}

export default App;
