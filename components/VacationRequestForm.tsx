import React, { useState, useMemo, useEffect } from 'react';
import { useVacationState, useVacationDispatch } from '../context/VacationContext';
import { VacationStatus, LeaveType } from '../types';
import Button from './ui/Button';
import { differenceInCalendarDays, isWeekend, addDays, isBefore, startOfToday, format, areIntervalsOverlapping } from 'date-fns';
import { isPublicHoliday } from '../utils/holidays';

function VacationRequestForm() {
   const [startDate, setStartDate] = useState('');
   const [endDate, setEndDate] = useState('');
   const [leaveType, setLeaveType] = useState<LeaveType>(LeaveType.Vacation);
   const [notes, setNotes] = useState('');
   const [error, setError] = useState<string | null>(null);

   const { requests, editingRequest, currentUser } = useVacationState();
   const dispatch = useVacationDispatch();

   if (!currentUser) return null;

  useEffect(() => {
    if (editingRequest) {
      setStartDate(format(editingRequest.startDate, 'yyyy-MM-dd'));
      setEndDate(format(editingRequest.endDate, 'yyyy-MM-dd'));
      setLeaveType(editingRequest.type);
      setNotes(editingRequest.notes || '');
      setError(null);
    } else {
        resetForm();
    }
  }, [editingRequest]);

  const approvedVacationDays = useMemo(() => {
    return requests
      .filter((req) => req.status === VacationStatus.Approved && req.type === LeaveType.Vacation && req.employeeName === currentUser.name)
      .reduce((sum, req) => sum + req.days, 0);
  }, [requests, currentUser]);

  const remainingDays = currentUser.vacationDays - approvedVacationDays;

  const calculateBusinessDays = (start: Date, end: Date): number => {
    const diff = differenceInCalendarDays(end, start);
    if (diff < 0) return 0;
    
    let businessDays = 0;
    for (let i = 0; i <= diff; i++) {
      const day = addDays(start, i);
      if (!isWeekend(day) && !isPublicHoliday(day)) {
        businessDays++;
      }
    }
    return businessDays;
  };

  const requestedDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return calculateBusinessDays(start, end);
  }, [startDate, endDate]);

  const resetForm = () => {
    setStartDate('');
    setEndDate('');
    setNotes('');
    setLeaveType(LeaveType.Vacation);
    setError(null);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError('Please select a start and end date.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = startOfToday();

    if (!editingRequest && isBefore(start, today)) {
        setError('Cannot request vacation in the past.');
        return;
    }

    if (isBefore(end, start)) {
      setError('End date cannot be before the start date.');
      return;
    }
    
    const userRequests = requests.filter(r => 
        r.employeeName === currentUser.name &&
        (editingRequest ? r.id !== editingRequest.id : true) &&
        (r.status === VacationStatus.Approved || r.status === VacationStatus.Pending)
    );

    const isOverlapping = userRequests.some(req => 
        areIntervalsOverlapping(
            { start, end },
            { start: req.startDate, end: req.endDate }
        )
    );

    if (isOverlapping) {
        setError('This request overlaps with another one of your approved or pending requests.');
        return;
    }
    
    const days = calculateBusinessDays(start, end);

    if (days <= 0) {
      const totalDaysInInterval = differenceInCalendarDays(end, start) + 1;
      let holidayCount = 0;
      for (let i = 0; i < totalDaysInInterval; i++) {
        const currentDay = addDays(start, i);
        if (isPublicHoliday(currentDay)) {
          holidayCount++;
        }
      }

      if (holidayCount > 0) {
        setError('The selected date range consists only of weekends and public holidays.');
      } else {
        setError('The selected date range consists only of weekend days.');
      }
      return;
    }
    
    if (leaveType === LeaveType.PaidLeave) {
        if (days > 7) {
            setError('Paid Leave requests cannot exceed 7 business days.');
            return;
        }
        if (!notes || notes.trim() === '') {
            setError('A reason (in Notes) is required for Paid Leave requests.');
            return;
        }
    }
    
    const remainingDaysForValidation = editingRequest && editingRequest.type === LeaveType.Vacation ? remainingDays + editingRequest.days : remainingDays;
    if (leaveType === LeaveType.Vacation && days > remainingDaysForValidation) {
        setError(`You only have ${remainingDays} vacation days remaining.`);
        return;
    }

    if(editingRequest) {
      dispatch({
        type: 'UPDATE_REQUEST',
        payload: {
          ...editingRequest,
          startDate: start,
          endDate: end,
          days,
          type: leaveType,
          notes: notes,
        },
      });
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: new Date().toISOString(),
          type: 'success',
          message: 'Your vacation request has been updated.',
        },
      });
    } else {
      dispatch({
        type: 'ADD_REQUEST',
        payload: {
          id: new Date().toISOString(),
          employeeName: currentUser.name,
          startDate: start,
          endDate: end,
          days,
          status: VacationStatus.Pending,
          type: leaveType,
          notes: notes,
        },
      });
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: new Date().toISOString(),
          type: 'success',
          message: 'Your vacation request has been submitted.',
        },
      });
    }

    if(!editingRequest) resetForm();
  };

  const handleCancelEdit = () => {
    dispatch({ type: 'CANCEL_EDIT' });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {editingRequest && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/20 rounded-md text-center">
            <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                You are editing a request.
            </p>
          </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Start Date</label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">End Date</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
          />
        </div>
      </div>
       <div>
          <label htmlFor="leave-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Type of Leave</label>
           <select
            id="leave-type"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
            className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
          >
            {Object.values(LeaveType).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Notes (Required for Paid Leave)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
            placeholder="e.g., Family vacation, doctor's appointment"
          />
        </div>
      {requestedDays > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-md text-center">
            <p className="font-semibold text-blue-800 dark:text-blue-300">
                You are requesting <span className="text-lg">{requestedDays}</span> business day(s).
            </p>
          </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-md text-center">
            <p className="font-semibold text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      <div className="flex justify-end gap-2">
        {editingRequest && (
            <Button type="button" onClick={handleCancelEdit} className="bg-slate-200 !text-slate-700 hover:bg-slate-300 dark:bg-slate-600 dark:!text-slate-200 dark:hover:bg-slate-500">Cancel</Button>
        )}
        <Button type="submit" disabled={!startDate || !endDate}>{editingRequest ? 'Update Request' : 'Submit Request'}</Button>
      </div>
    </form>
  );
}

export default VacationRequestForm;