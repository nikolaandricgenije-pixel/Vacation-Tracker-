import React, { useState, useMemo } from 'react';
import { useVacationState, useVacationDispatch } from '../context/VacationContext';
import { WorkType } from '../types';
import Button from './ui/Button';
import { startOfDay, format, startOfWeek, startOfMonth, endOfWeek, endOfMonth, differenceInMinutes } from 'date-fns';
import ClockIcon from './icons/ClockIcon';
import CalendarIcon from './icons/CalendarIcon';

function TimeTracker() {
   const { timeEntries, currentUser } = useVacationState();
   const dispatch = useVacationDispatch();
   const [selectedWorkType, setSelectedWorkType] = useState<WorkType>(WorkType.Office);
   const [businessTripDate, setBusinessTripDate] = useState('');

   if (!currentUser) return null;

   const today = startOfDay(new Date());
   const currentEntry = timeEntries.find(e => e.employeeName === currentUser.name && e.date.getTime() === today.getTime());

   const userEntries = timeEntries.filter(e => e.employeeName === currentUser.name);

   const dailyStats = useMemo(() => {
     const entry = userEntries.find(e => e.date.getTime() === today.getTime());
     if (!entry) return { working: 0, total: 0 };

     const workingHours = entry.totalWorkingMinutes / 60;

     // Calculate total tracked time (from first clock in to last clock out)
     let totalMinutes = 0;
     if (entry.clockIn && entry.clockOut) {
       totalMinutes = differenceInMinutes(entry.clockOut, entry.clockIn);
     } else if (entry.lastClockIn) {
       // Still clocked in, calculate from last clock in to now
       totalMinutes = differenceInMinutes(new Date(), entry.lastClockIn) + entry.totalWorkingMinutes;
     }

     return {
       working: workingHours,
       total: totalMinutes / 60
     };
   }, [userEntries, today]);

   const weeklyHours = useMemo(() => {
     const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
     const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
     const weekEntries = userEntries.filter(e => e.date >= weekStart && e.date <= weekEnd);
     return weekEntries.reduce((sum, e) => sum + e.totalWorkingMinutes, 0) / 60;
   }, [userEntries, today]);

   const monthlyHours = useMemo(() => {
     const monthStart = startOfMonth(today);
     const monthEnd = endOfMonth(today);
     const monthEntries = userEntries.filter(e => e.date >= monthStart && e.date <= monthEnd);
     return monthEntries.reduce((sum, e) => sum + e.totalWorkingMinutes, 0) / 60;
   }, [userEntries, today]);

   const monthlyOvertime = useMemo(() => {
     const monthStart = startOfMonth(today);
     const monthEnd = endOfMonth(today);
     const monthEntries = userEntries.filter(e => e.date >= monthStart && e.date <= monthEnd);

     // Calculate overtime: hours beyond 8 per day or 40 per week
     let overtimeHours = 0;

     // Group by weeks
     const weeks = {};
     monthEntries.forEach(entry => {
       const weekStart = startOfWeek(entry.date, { weekStartsOn: 1 });
       const weekKey = weekStart.toISOString().split('T')[0];

       if (!weeks[weekKey]) {
         weeks[weekKey] = [];
       }
       weeks[weekKey].push(entry);
     });

     // Calculate weekly overtime
     Object.values(weeks).forEach((weekEntries: any[]) => {
       const weeklyTotal = weekEntries.reduce((sum, e) => sum + e.totalWorkingMinutes, 0) / 60;
       if (weeklyTotal > 40) {
         overtimeHours += weeklyTotal - 40;
       }
     });

     return overtimeHours;
   }, [userEntries, today]);

  const handleClockIn = () => {
    dispatch({ type: 'CLOCK_IN', payload: { workType: selectedWorkType } });
  };

  const handleClockOut = () => {
    dispatch({ type: 'CLOCK_OUT' });
  };

  const handleStartBreak = () => {
    dispatch({ type: 'START_BREAK' });
  };

  const handleEndBreak = () => {
    dispatch({ type: 'END_BREAK' });
  };

  const handleStartOff = () => {
    dispatch({ type: 'START_OFF' });
  };

  const handleEndOff = () => {
    dispatch({ type: 'END_OFF' });
  };

  const handleAddBusinessTrip = () => {
    if (businessTripDate) {
      dispatch({ type: 'ADD_BUSINESS_TRIP', payload: { date: new Date(businessTripDate) } });
      setBusinessTripDate('');
    }
  };

  const isOnBreak = currentEntry?.breaks.some(b => !b.end);
  const isOnOff = currentEntry?.offs.some(o => !o.end);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Time Tracker</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-lg border border-blue-200 dark:border-blue-500/20">
          <ClockIcon className="mx-auto mb-2 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Today (Working)</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{dailyStats.working.toFixed(1)}h</p>
          {dailyStats.total > dailyStats.working && (
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              Total: {dailyStats.total.toFixed(1)}h
            </p>
          )}
        </div>
        <div className="bg-green-50 dark:bg-green-500/10 p-4 rounded-lg border border-green-200 dark:border-green-500/20">
          <CalendarIcon className="mx-auto mb-2 text-green-600 dark:text-green-400" />
          <p className="text-sm text-slate-600 dark:text-slate-400">This Week</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{weeklyHours.toFixed(1)}h</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-500/10 p-4 rounded-lg border border-purple-200 dark:border-purple-500/20">
          <CalendarIcon className="mx-auto mb-2 text-purple-600 dark:text-purple-400" />
          <p className="text-sm text-slate-600 dark:text-slate-400">This Month</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{monthlyHours.toFixed(1)}h</p>
        </div>
        <div className={`p-4 rounded-lg border ${
          monthlyOvertime > 0
            ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20'
            : 'bg-gray-50 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20'
        }`}>
          <div className="text-orange-500 mb-2">⏰</div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Monthly Overtime</p>
          <p className={`text-2xl font-bold ${
            monthlyOvertime > 0
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {monthlyOvertime.toFixed(1)}h
          </p>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 p-4 rounded-lg border border-blue-200 dark:border-blue-500/20">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">💡</div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Understanding Time Tracking</h4>
            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <p><strong>Break:</strong> Short pauses that count as working time</p>
              <p><strong>Off:</strong> Personal time that doesn't count as working hours</p>
              <p><strong>Overtime:</strong> Hours beyond 40 per week</p>
              {dailyStats.total > dailyStats.working && (
                <p className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-500/20 rounded text-yellow-800 dark:text-yellow-200">
                  Today: {dailyStats.total.toFixed(1)}h tracked, {dailyStats.working.toFixed(1)}h working
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {!currentEntry?.isClockedIn && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Work Type</label>
          <select
            value={selectedWorkType}
            onChange={(e) => setSelectedWorkType(e.target.value as WorkType)}
            className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
          >
            {Object.values(WorkType).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <Button onClick={handleClockIn} className="mt-2">Clock In</Button>
        </div>
      )}

      {currentEntry?.isClockedIn && (
        <div className="space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Clocked in at {currentEntry.lastClockIn ? format(currentEntry.lastClockIn, 'HH:mm') : 'N/A'} - {currentEntry.workType}
          </p>
          <div className="flex gap-2 flex-wrap">
            {!isOnBreak && !isOnOff && <Button onClick={handleStartBreak}>Start Break</Button>}
            {isOnBreak && <Button onClick={handleEndBreak}>End Break</Button>}
            {!isOnOff && <Button onClick={handleStartOff}>Start Off</Button>}
            {isOnOff && <Button onClick={handleEndOff}>End Off</Button>}
            <Button onClick={handleClockOut}>Clock Out</Button>
          </div>
        </div>
      )}

      {currentEntry && !currentEntry.isClockedIn && currentEntry.totalWorkingMinutes > 0 && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Total today: {Math.floor(currentEntry.totalWorkingMinutes / 60)}h {currentEntry.totalWorkingMinutes % 60}m
        </p>
      )}

      <div className="border-t pt-4">
        <h4 className="text-md font-medium text-slate-700 dark:text-slate-200">Add Business Trip</h4>
        <div className="flex gap-2 mt-2">
          <input
            type="date"
            value={businessTripDate}
            onChange={(e) => setBusinessTripDate(e.target.value)}
            className="rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
          />
          <Button onClick={handleAddBusinessTrip}>Add</Button>
        </div>
      </div>
    </div>
  );
}

export default TimeTracker;