import { isSameDay, getYear, isWeekend, eachDayOfInterval, startOfMonth, endOfMonth, differenceInCalendarDays } from 'date-fns';

const getPublicHolidays = (year: number): Date[] => {
  // Public holidays for Bosnia and Herzegovina (FBiH) from 2026 onwards
  if (year >= 2026) {
    return [
      new Date(year, 0, 1),   // Nova godina
      new Date(year, 0, 2),   // Nova godina (observed)
      new Date(year, 2, 1),   // Dan nezavisnosti (FBiH)
      new Date(year, 4, 1),   // Praznik rada
      new Date(year, 4, 2),   // Praznik rada (observed)
      new Date(year, 10, 25), // Dan državnosti (FBiH)
    ];
  }
  // Default for other years (secular holidays only)
  return [
    new Date(year, 0, 1),   // New Year's Day
    new Date(year, 2, 1),   // Independence Day
    new Date(year, 4, 1),   // Labor Day
    new Date(year, 10, 25), // Statehood Day
  ];
};

export const isPublicHoliday = (date: Date): boolean => {
  const holidays = getPublicHolidays(getYear(date));
  return holidays.some(holiday => isSameDay(date, holiday));
};

export function calculateExpectedHoursForMonth(employeeName: string, month: Date, requests: any[]): number {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Count working days (Mon-Fri, not holidays)
  let workingDays = 0;
  for (const day of daysInMonth) {
    if (!isWeekend(day) && !isPublicHoliday(day)) {
      workingDays++;
    }
  }

  // Subtract approved leaves in that month
  const approvedLeaves = requests.filter(req =>
    req.employeeName === employeeName &&
    req.status === 'Approved' &&
    req.startDate <= monthEnd &&
    req.endDate >= monthStart
  );

  let leaveDays = 0;
  for (const leave of approvedLeaves) {
    const leaveStart = leave.startDate > monthStart ? leave.startDate : monthStart;
    const leaveEnd = leave.endDate < monthEnd ? leave.endDate : monthEnd;
    const leaveDaysInMonth = differenceInCalendarDays(leaveEnd, leaveStart) + 1;
    // Only count weekdays
    for (let i = 0; i < leaveDaysInMonth; i++) {
      const day = new Date(leaveStart);
      day.setDate(day.getDate() + i);
      if (!isWeekend(day) && !isPublicHoliday(day)) {
        leaveDays++;
      }
    }
  }

  const netWorkingDays = workingDays - leaveDays;
  return Math.max(0, netWorkingDays * 8); // 8 hours per day
}
