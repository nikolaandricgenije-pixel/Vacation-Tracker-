import React, { useMemo } from 'react';
import { useVacationState, useVacationDispatch } from '../context/VacationContext';
import { VacationStatus, LeaveType } from '../types';
import Button from './ui/Button';
import Card from './ui/Card';
import ClockIcon from './icons/ClockIcon';
import CalendarIcon from './icons/CalendarIcon';
import PencilIcon from './icons/PencilIcon';

function QuickActions() {
  const { requests, currentUser, timeEntries } = useVacationState();
  const dispatch = useVacationDispatch();

  const userRequests = requests.filter(r => r.employeeName === currentUser?.name);
  const pendingRequests = userRequests.filter(r => r.status === VacationStatus.Pending);
  const approvedVacation = userRequests.filter(r => r.status === VacationStatus.Approved && r.type === LeaveType.Vacation).reduce((sum, r) => sum + r.days, 0);
  const remainingVacation = (currentUser?.vacationDays || 0) - approvedVacation;

  const todayEntries = timeEntries.filter(e => e.employeeName === currentUser?.name && e.date.toDateString() === new Date().toDateString());
  const todayHours = todayEntries.reduce((sum, e) => sum + e.totalWorkingMinutes, 0) / 60;

  const handleQuickRequest = () => {
    // Scroll to form or open modal
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleClockIn = () => {
    dispatch({ type: 'CLOCK_IN', payload: { workType: 'Work from office' } });
  };

  if (!currentUser) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
            <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Remaining Vacation</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{remainingVacation} days</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
            <ClockIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Today's Hours</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{todayHours.toFixed(1)}h</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
            <PencilIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
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