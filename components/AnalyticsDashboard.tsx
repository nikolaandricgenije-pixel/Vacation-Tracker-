import React, { useMemo, useState, useEffect } from 'react';
import { useVacationState, useVacationDispatch } from '../context/VacationContext';
import { LeaveType, VacationRequest, VacationStatus } from '../types';
import { format, subMonths, getMonth, getYear, startOfMonth, endOfMonth } from 'date-fns';
import Button from './ui/Button';
import { calculateExpectedHoursForMonth } from '../utils/holidays';

interface EmployeeStat {
  name: string;
  totalApproved: number;
  [LeaveType.Vacation]: number;
  [LeaveType.PaidLeave]: number;
  [LeaveType.SickLeave]: number;
  pending: number;
}

const StatSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-3">{title}</h3>
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">{children}</div>
  </div>
);

function AnalyticsDashboard() {
   const { requests, timeEntries, users } = useVacationState();
   const dispatch = useVacationDispatch();
   const [showReport, setShowReport] = useState(false);
   const [selectedMonth, setSelectedMonth] = useState(new Date());

  const employeeStats = useMemo(() => {
    const stats: Record<string, EmployeeStat> = {};

    requests.forEach(req => {
      if (!stats[req.employeeName]) {
        stats[req.employeeName] = {
          name: req.employeeName,
          totalApproved: 0,
          [LeaveType.Vacation]: 0,
          [LeaveType.PaidLeave]: 0,
          [LeaveType.SickLeave]: 0,
          pending: 0,
        };
      }

      if (req.status === VacationStatus.Approved) {
        stats[req.employeeName].totalApproved += req.days;
        stats[req.employeeName][req.type] += req.days;
      } else if (req.status === VacationStatus.Pending) {
        stats[req.employeeName].pending += 1;
      }
    });

    return Object.values(stats).sort((a, b) => b.totalApproved - a.totalApproved);
  }, [requests]);

  const leaveDistribution = useMemo(() => {
    const distribution: Record<LeaveType, number> = {
      [LeaveType.Vacation]: 0,
      [LeaveType.PaidLeave]: 0,
      [LeaveType.SickLeave]: 0,
    };
    requests.forEach(req => {
      if (req.status === VacationStatus.Approved) {
        distribution[req.type] += req.days;
      }
    });
    return distribution;
  }, [requests]);
  
  const totalLeaveDays = Object.values(leaveDistribution).reduce((sum: number, days: number) => sum + days, 0);
  
  const getConicGradient = () => {
    if (totalLeaveDays === 0) return 'rgb(241 245 249)';
    const vacPercent = (Number(leaveDistribution[LeaveType.Vacation]) / totalLeaveDays) * 100;
    const paidPercent = (Number(leaveDistribution[LeaveType.PaidLeave]) / totalLeaveDays) * 100;

    return `conic-gradient(
      #22c55e 0% ${vacPercent}%,
      #a855f7 ${vacPercent}% ${vacPercent + paidPercent}%,
      #f97316 ${vacPercent + paidPercent}% 100%
    )`;
  };
  
   const monthlyTrends = useMemo(() => {
    const trends = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), i);
      return {
        name: format(date, 'MMM'),
        year: getYear(date),
        month: getMonth(date),
        totalDays: 0,
      };
    }).reverse();

    requests.forEach(req => {
      if (req.status === VacationStatus.Approved) {
        const reqMonth = getMonth(req.startDate);
        const reqYear = getYear(req.startDate);
        const trend = trends.find(t => t.month === reqMonth && t.year === reqYear);
        if (trend) {
          trend.totalDays += req.days;
        }
      }
    });
    return trends;
  }, [requests]);

  const maxMonthlyDays = Math.max(...monthlyTrends.map(m => m.totalDays), 1);

  const employeeTimeStats = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    return users.filter(u => u.roles.includes('Employee')).map(user => {
      const userEntries = timeEntries.filter(e => e.employeeName === user.name && e.date >= monthStart && e.date <= monthEnd);
      const actualHours = userEntries.reduce((sum, e) => sum + e.totalWorkingMinutes, 0) / 60;
      const expectedHours = calculateExpectedHoursForMonth(user.name, selectedMonth, requests);
      const difference = actualHours - expectedHours;
      const status = difference < -3 ? 'Under' : difference > 0 ? 'Over' : 'OK';
      return {
        name: user.name,
        actualHours,
        expectedHours,
        difference,
        status,
      };
    });
  }, [users, timeEntries, requests, selectedMonth]);

  useEffect(() => {
    employeeTimeStats.forEach(stat => {
      if (stat.status === 'Under') {
        // Check if notification already exists
        const existingNotification = false; // For simplicity, always notify for now
        if (!existingNotification) {
          dispatch({
            type: 'ADD_NOTIFICATION',
            payload: {
              id: new Date().toISOString() + stat.name,
              type: 'error',
              message: `${stat.name} has ${stat.difference.toFixed(1)} hours deficit for ${format(selectedMonth, 'MMMM yyyy')}.`,
            },
          });
        }
      }
    });
  }, [employeeTimeStats, dispatch, selectedMonth]);

  const exportToCSV = () => {
    const headers = ['Employee', 'Expected Hours', 'Actual Hours', 'Difference', 'Status'];
    const rows = employeeTimeStats.map(stat => [
      stat.name,
      stat.expectedHours.toFixed(1),
      stat.actualHours.toFixed(1),
      stat.difference.toFixed(1),
      stat.status
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `time-tracking-${format(selectedMonth, 'yyyy-MM')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200">Team Analytics Dashboard</h2>
      
      <StatSection title="Employee Overview">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-100 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-4 py-2">Employee</th>
                <th scope="col" className="px-4 py-2 text-center">Total</th>
                <th scope="col" className="px-4 py-2 text-center">Vacation</th>
                <th scope="col" className="px-4 py-2 text-center">Paid</th>
                <th scope="col" className="px-4 py-2 text-center">Sick</th>
                <th scope="col" className="px-4 py-2 text-center">Pending</th>
              </tr>
            </thead>
            <tbody>
              {employeeStats.map(stat => (
                <tr key={stat.name} className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-white whitespace-nowrap">{stat.name}</td>
                  <td className="px-4 py-2 text-center font-bold">{stat.totalApproved}</td>
                  <td className="px-4 py-2 text-center">{stat[LeaveType.Vacation]}</td>
                  <td className="px-4 py-2 text-center">{stat[LeaveType.PaidLeave]}</td>
                  <td className="px-4 py-2 text-center">{stat[LeaveType.SickLeave]}</td>
                  <td className="px-4 py-2 text-center">{stat.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </StatSection>

      <StatSection title="Leave Distribution">
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <div 
                className="w-24 h-24 rounded-full" 
                style={{ background: getConicGradient() }}
                role="img"
                aria-label={`Leave distribution: ${leaveDistribution[LeaveType.Vacation]} vacation days, ${leaveDistribution[LeaveType.PaidLeave]} paid leave days, ${leaveDistribution[LeaveType.SickLeave]} sick leave days.`}
            ></div>
            <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>Vacation: {leaveDistribution[LeaveType.Vacation]} days</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span>Paid Leave: {leaveDistribution[LeaveType.PaidLeave]} days</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span>Sick Leave: {leaveDistribution[LeaveType.SickLeave]} days</span></div>
            </div>
        </div>
      </StatSection>

       <StatSection title="Monthly Leave Trends (Last 12 Months)">
         <div className="flex justify-between items-end h-40 gap-1">
           {monthlyTrends.map((month, i) => (
             <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${month.name} ${month.year}: ${month.totalDays} days`}>
               <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{month.totalDays > 0 ? month.totalDays : ''}</div>
               <div 
                 className="w-full bg-blue-200 dark:bg-blue-500/50 rounded-t-sm hover:bg-blue-300 dark:hover:bg-blue-500/80 transition-colors"
                 style={{ height: `${(month.totalDays / maxMonthlyDays) * 90}%` }}
               ></div>
               <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{month.name}</div>
             </div>
           ))}
         </div>
      </StatSection>

      <StatSection title="Time Tracking Overview">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Month:</label>
            <input
              type="month"
              value={format(selectedMonth, 'yyyy-MM')}
              onChange={(e) => setSelectedMonth(new Date(e.target.value))}
              className="rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
              <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-100 dark:bg-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-2">Employee</th>
                  <th scope="col" className="px-4 py-2">Expected Hours</th>
                  <th scope="col" className="px-4 py-2">Actual Hours</th>
                  <th scope="col" className="px-4 py-2">Difference</th>
                  <th scope="col" className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {employeeTimeStats.map(stat => (
                  <tr key={stat.name} className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                    <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{stat.name}</td>
                    <td className="px-4 py-2">{stat.expectedHours.toFixed(1)}h</td>
                    <td className="px-4 py-2">{stat.actualHours.toFixed(1)}h</td>
                    <td className="px-4 py-2">{stat.difference.toFixed(1)}h</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        stat.status === 'Under' ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' :
                        stat.status === 'Over' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                      }`}>
                        {stat.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </StatSection>

      <StatSection title="Reports">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setShowReport(!showReport)}>
              {showReport ? 'Hide' : 'Generate'} Detailed Report
            </Button>
            <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
              Export to CSV
            </Button>
          </div>
          {showReport && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th scope="col" className="px-4 py-2">Employee</th>
                    <th scope="col" className="px-4 py-2">Type</th>
                    <th scope="col" className="px-4 py-2">Start Date</th>
                    <th scope="col" className="px-4 py-2">End Date</th>
                    <th scope="col" className="px-4 py-2">Days</th>
                    <th scope="col" className="px-4 py-2">Status</th>
                    <th scope="col" className="px-4 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id} className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                      <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{req.employeeName}</td>
                      <td className="px-4 py-2">{req.type}</td>
                      <td className="px-4 py-2">{format(req.startDate, 'yyyy-MM-dd')}</td>
                      <td className="px-4 py-2">{format(req.endDate, 'yyyy-MM-dd')}</td>
                      <td className="px-4 py-2">{req.days}</td>
                      <td className="px-4 py-2">{req.status}</td>
                      <td className="px-4 py-2">{req.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </StatSection>

    </div>
  );
}

export default AnalyticsDashboard;