import React, { useMemo, useEffect, useState } from 'react';
import { useVacationState, useVacationDispatch } from '../context/VacationContext';
import { VacationStatus, LeaveType, WorkType } from '../types';
import Button from './ui/Button';
import Card from './ui/Card';
import ClockIcon from './icons/ClockIcon';
import CalendarIcon from './icons/CalendarIcon';
import PencilIcon from './icons/PencilIcon';

function QuickActions() {
  const { requests, currentUser, timeEntries } = useVacationState();
  const dispatch = useVacationDispatch();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const userRequests = requests.filter(r => r.employeeName === currentUser?.name);
  const pendingRequests = userRequests.filter(r => r.status === VacationStatus.Pending);
  const approvedVacation = userRequests.filter(r => r.status === VacationStatus.Approved && r.type === LeaveType.Vacation).reduce((sum, r) => sum + r.days, 0);
  const remainingVacation = (currentUser?.vacationDays || 0) - approvedVacation;

  const todayEntries = timeEntries.filter(e => e.employeeName === currentUser?.name && e.date.toDateString() === new Date().toDateString());
  const todayHours = todayEntries.reduce((sum, e) => sum + e.totalWorkingMinutes, 0) / 60;

  // Auto-refresh time entries every 30 seconds to sync with Discord commands
  useEffect(() => {
    const autoRefresh = setInterval(() => {
      if (currentUser) {
        handleRefresh();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoRefresh);
  }, [currentUser]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/time-entries`);
      if (response.ok) {
        const timeEntries = await response.json();
        // Convert date strings to Date objects
        const convertedEntries = timeEntries.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
          lastClockIn: entry.lastClockIn ? new Date(entry.lastClockIn) : null,
          breaks: entry.breaks.map((b: any) => ({
            start: new Date(b.start),
            end: b.end ? new Date(b.end) : null,
          })),
          offs: entry.offs.map((o: any) => ({
            start: new Date(o.start),
            end: o.end ? new Date(o.end) : null,
          })),
        }));
        dispatch({ type: 'SET_TIME_ENTRIES', payload: convertedEntries });
      }
    } catch (error) {
      console.error('Failed to refresh time entries:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleQuickRequest = () => {
    // Scroll to form or open modal
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleClockIn = () => {
    dispatch({ type: 'CLOCK_IN', payload: { workType: WorkType.Office } });
  };

  if (!currentUser) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <Card className="p-5 hover:shadow-blue-500/10">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-500/20 dark:to-blue-600/20 rounded-xl shadow-sm">
            <CalendarIcon />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Remaining Vacation</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{remainingVacation} <span className="text-lg font-normal text-slate-500">days</span></p>
          </div>
        </div>
      </Card>

      <Card className="p-5 hover:shadow-green-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-500/20 dark:to-green-600/20 rounded-xl shadow-sm">
              <ClockIcon />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Today's Hours</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{todayHours.toFixed(1)} <span className="text-lg font-normal text-slate-500">hrs</span></p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 disabled:opacity-50 hover:scale-110"
            title="Refresh today's hours"
          >
            <span className={`text-sm transition-transform ${isRefreshing ? 'animate-spin' : ''}`}>🔄</span>
          </button>
        </div>
      </Card>

      <Card className="p-5 hover:shadow-amber-500/10">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-500/20 dark:to-amber-600/20 rounded-xl shadow-sm">
            <PencilIcon />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Pending Requests</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{pendingRequests.length} <span className="text-lg font-normal text-slate-500">items</span></p>
          </div>
        </div>
      </Card>

      <Card className="p-5 hover:shadow-purple-500/10">
        <div className="flex flex-col space-y-3">
          <Button onClick={handleQuickRequest} className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-500/25">
            📝 Request Time Off
          </Button>
          <Button onClick={handleClockIn} className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-green-500/25">
            🟢 Clock In
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default QuickActions;