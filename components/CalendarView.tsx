import React, { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameMonth,
  isWeekend,
  addMonths,
  subMonths,
  isWithinInterval,
  addYears,
  subYears,
} from 'date-fns';
import { useVacationState } from '../context/VacationContext';
import { VacationStatus, LeaveType } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ChevronDoubleLeftIcon from './icons/ChevronDoubleLeftIcon';
import ChevronDoubleRightIcon from './icons/ChevronDoubleRightIcon';
import { isPublicHoliday } from '../utils/holidays';


function CalendarView() {
   const [currentMonth, setCurrentMonth] = useState(new Date());
   const [selectedDay, setSelectedDay] = useState<Date | null>(null);
   const { requests, isAdmin } = useVacationState();

  const approvedVacations = useMemo(() =>
    requests.filter(req => req.status === VacationStatus.Approved),
    [requests]
  );

  const getVacationsForDay = (day: Date) => {
    return approvedVacations.filter(vacation =>
      isWithinInterval(day, { start: vacation.startDate, end: vacation.endDate })
    );
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfMonth = monthStart.getDay();
  
  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handlePrevYear = () => {
    setCurrentMonth(subYears(currentMonth, 1));
  };

  const handleNextYear = () => {
    setCurrentMonth(addYears(currentMonth, 1));
  };
  
  const getDayClassName = (day: Date) => {
    let classes = "flex items-center justify-center h-12 w-12 rounded-full text-sm transition-colors relative ";

    const vacationsForDay = getVacationsForDay(day);
    const hasVacations = vacationsForDay.length > 0;

    if (!isSameMonth(day, currentMonth)) {
      classes += "text-slate-400 dark:text-slate-600";
    } else if (isToday(day)) {
      classes += "bg-blue-600 text-white font-bold ring-2 ring-blue-300 dark:ring-blue-500";
    } else if (isPublicHoliday(day)) {
      classes += "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 font-semibold border-2 border-red-300 dark:border-red-700";
    } else if (isWeekend(day)) {
      classes += "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium";
    } else if (hasVacations) {
      // Show vacation colors
      if (vacationsForDay.some(v => v.type === LeaveType.PaidLeave)) {
        classes += "bg-purple-200 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 font-semibold border-2 border-purple-300 dark:border-purple-700";
      } else if (vacationsForDay.some(v => v.type === LeaveType.SickLeave)) {
        classes += "bg-orange-200 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 font-semibold border-2 border-orange-300 dark:border-orange-700";
      } else {
        classes += "bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200 font-semibold border-2 border-green-300 dark:border-green-700";
      }
    } else {
      classes += "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700";
    }

    // Add cursor pointer for clickable days (admin only)
    if (isAdmin && isSameMonth(day, currentMonth)) {
      classes += " cursor-pointer";
    }

    return classes;
  };

  const handleDayClick = (day: Date) => {
    if (isAdmin && isSameMonth(day, currentMonth)) {
      setSelectedDay(day);
    }
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-2">
           <button onClick={handlePrevYear} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Previous year">
            <ChevronDoubleLeftIcon />
          </button>
          <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Previous month">
            <ChevronLeftIcon />
          </button>
          <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Next month">
            <ChevronRightIcon />
          </button>
           <button onClick={handleNextYear} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Next year">
            <ChevronDoubleRightIcon />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-slate-500 dark:text-slate-400 text-xs">
        {daysOfWeek.map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-2">
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}
        {daysInMonth.map(day => (
          <div
            key={day.toString()}
            className={getDayClassName(day)}
            onClick={() => handleDayClick(day)}
            title={isAdmin ? "Click to view vacation details" : undefined}
          >
            {format(day, 'd')}
            {isAdmin && getVacationsForDay(day).length > 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-current rounded-full opacity-75"></div>
            )}
          </div>
        ))}
      </div>

      {/* Vacation Details Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  {format(selectedDay, 'EEEE, MMMM d, yyyy')}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl"
                >
                  ×
                </button>
              </div>

              {(() => {
                const vacations = getVacationsForDay(selectedDay);
                const isHoliday = isPublicHoliday(selectedDay);
                const isWeekendDay = isWeekend(selectedDay);

                if (vacations.length === 0 && !isHoliday && !isWeekendDay) {
                  return (
                    <p className="text-slate-600 dark:text-slate-400 text-center py-8">
                      No vacations or special days on this date.
                    </p>
                  );
                }

                return (
                  <div className="space-y-4">
                    {isHoliday && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center space-x-2">
                          <span className="text-red-500">🏖️</span>
                          <span className="font-semibold text-red-800 dark:text-red-200">Public Holiday</span>
                        </div>
                      </div>
                    )}

                    {isWeekendDay && !isHoliday && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-500">🏠</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Weekend</span>
                        </div>
                      </div>
                    )}

                    {vacations.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
                          People on Vacation ({vacations.length})
                        </h4>
                        <div className="space-y-2">
                          {vacations.map((vacation) => (
                            <div
                              key={vacation.id}
                              className={`p-3 rounded-lg border ${
                                vacation.type === LeaveType.PaidLeave
                                  ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                                  : vacation.type === LeaveType.SickLeave
                                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                                  : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className={
                                    vacation.type === LeaveType.PaidLeave ? 'text-purple-600' :
                                    vacation.type === LeaveType.SickLeave ? 'text-orange-600' :
                                    'text-green-600'
                                  }>
                                    {vacation.type === LeaveType.PaidLeave ? '💰' :
                                     vacation.type === LeaveType.SickLeave ? '🤒' : '🏖️'}
                                  </span>
                                  <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {vacation.employeeName}
                                  </span>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  vacation.status === VacationStatus.Approved
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                                }`}>
                                  {vacation.status}
                                </span>
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {format(vacation.startDate, 'MMM d')} - {format(vacation.endDate, 'MMM d, yyyy')}
                                {vacation.notes && (
                                  <div className="mt-1 italic">"{vacation.notes}"</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarView;
