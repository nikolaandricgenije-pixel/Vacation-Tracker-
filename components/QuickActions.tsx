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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
            <CalendarIcon />
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Remaining Vacation</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{remainingVacation} days</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
              <ClockIcon />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Today's Hours</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{todayHours.toFixed(1)}h</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="Refresh today's hours"
          >
            <span className={`text-sm ${isRefreshing ? 'animate-spin' : ''}`}>🔄</span>
          </button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
            <PencilIcon />
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Pending Requests</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{pendingRequests.length}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-col space-y-2">
          <Button onClick={handleQuickRequest} className="w-full">
            Request Time Off
          </Button>
          <Button onClick={handleClockIn} className="w-full bg-green-600 hover:bg-green-700">
            Clock In
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default QuickActions;