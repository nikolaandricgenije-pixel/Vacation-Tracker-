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
  const { requests } = useVacationState();

  const approvedVacations = useMemo(() => 
    requests.filter(req => req.status === VacationStatus.Approved), 
    [requests]
  );

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
    let classes = "flex items-center justify-center h-12 w-12 rounded-full text-sm transition-colors ";

    const vacationInfo = approvedVacations.find(vacation => 
        isWithinInterval(day, { start: vacation.startDate, end: vacation.endDate })
    );

    if (!isSameMonth(day, currentMonth)) {
      classes += "text-slate-400 dark:text-slate-600";
    } else if (isToday(day)) {
      classes += "bg-blue-600 text-white font-bold";
    } else if (isPublicHoliday(day)) {
        classes += "bg-red-200 dark:bg-red-500/30 text-red-800 dark:text-red-300 font-semibold";
    } else if (vacationInfo) {
        if (vacationInfo.type === LeaveType.PaidLeave) {
             classes += " bg-purple-200 dark:bg-purple-500/30 text-purple-800 dark:text-purple-300 font-semibold";
        } else if (vacationInfo.type === LeaveType.SickLeave) {
            classes += " bg-orange-200 dark:bg-orange-500/30 text-orange-800 dark:text-orange-300 font-semibold";
        } else {
            classes += " bg-green-200 dark:bg-green-500/30 text-green-800 dark:text-green-300 font-semibold";
        }
    } else if (isWeekend(day)) {
      classes += "text-slate-500 dark:text-slate-400";
    } else {
       classes += "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700";
    }


    return classes;
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
          <div key={day.toString()} className={getDayClassName(day)}>
            {format(day, 'd')}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CalendarView;
