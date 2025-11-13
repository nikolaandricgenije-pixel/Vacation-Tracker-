import React, { useState, useEffect, useMemo } from 'react';
import { useVacationState, useVacationDispatch } from '../context/VacationContext';
import { WorkType } from '../types';
import Button from './ui/Button';
import ClockIcon from './icons/ClockIcon';
import { format, differenceInSeconds, startOfDay, isAfter } from 'date-fns';

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

function ClockWidget() {
   const { timeEntries, currentUser } = useVacationState();
   const dispatch = useVacationDispatch();
   const [currentTime, setCurrentTime] = useState(new Date());
   const [selectedWorkType, setSelectedWorkType] = useState<WorkType>(WorkType.Office);
   const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Check for midnight reset
      if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
        // Reset today's entry at midnight
        // This would need to be handled in context, but for now just log
        console.log('Midnight reset triggered');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentUser) return null;

  const today = new Date();
  const todayEntry = timeEntries.find(e =>
    e.employeeName === currentUser.name &&
    e.date.toDateString() === today.toDateString()
  );

  const isClockedIn = todayEntry?.isClockedIn || false;
  const currentWorkType = todayEntry?.workType;
  const todayHours = todayEntry ? todayEntry.totalWorkingMinutes / 60 : 0;

  const isOnBreak = todayEntry?.breaks.some(b => !b.end);
  const isOnOff = todayEntry?.offs.some(o => !o.end);

  // Calculate current session time if clocked in, accounting for active off periods
  const currentSessionSeconds = useMemo(() => {
    if (!isClockedIn || !todayEntry?.lastClockIn) return 0;

    let sessionSeconds = differenceInSeconds(currentTime, todayEntry.lastClockIn);

    // If there's an active off period, pause the timer (don't add new time)
    if (isOnOff && todayEntry.offs.length > 0) {
      const activeOff = todayEntry.offs[todayEntry.offs.length - 1];
      if (activeOff.start && !activeOff.end) {
        // Calculate time up to when off started
        const timeBeforeOff = differenceInSeconds(activeOff.start, todayEntry.lastClockIn);
        sessionSeconds = timeBeforeOff;
      }
    }

    return Math.max(0, sessionSeconds); // Ensure non-negative
  }, [isClockedIn, todayEntry, currentTime, isOnOff]);

  const totalTodaySeconds = (todayHours * 3600) + currentSessionSeconds;
  const displayHours = Math.floor(totalTodaySeconds / 3600);
  const displayMinutes = Math.floor((totalTodaySeconds % 3600) / 60);
  const displaySeconds = Math.floor(totalTodaySeconds % 60);

  const timeDisplay = isClockedIn
    ? `${displayHours.toString().padStart(2, '0')}:${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`
    : todayHours > 0
    ? `${Math.floor(todayHours)}:${Math.floor((todayHours % 1) * 60).toString().padStart(2, '0')}h worked`
    : '00:00:00';

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
        // Update the time entries in state
        // Note: This is a simplified approach. In a real app, you'd have a proper action for this
        dispatch({ type: 'SET_TIME_ENTRIES', payload: convertedEntries });
      }
    } catch (error) {
      console.error('Failed to refresh time entries:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-2xl p-8 text-white shadow-2xl mb-8 relative overflow-hidden animate-slide-in-up">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 -translate-y-12 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-white rounded-full translate-y-10 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg backdrop-blur-sm transition-all duration-300 ${
              isClockedIn ? 'bg-green-500/20 animate-pulse-glow' : 'bg-white/20'
            }`}>
              <ClockIcon />
            </div>
            <div>
              <h2 className="text-xl font-bold">Time Tracker</h2>
              <p className="text-sm opacity-80">{format(currentTime, 'EEEE, MMMM d')}</p>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh data from Discord commands"
          >
            <RefreshIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Enhanced Status Badge */}
          <div className={`px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border transition-all duration-500 animate-scale-in ${
            isClockedIn
              ? isOnBreak
                ? 'bg-yellow-500/20 border-yellow-400/30 text-yellow-200 shadow-yellow-500/20'
                : isOnOff
                ? 'bg-gray-500/20 border-gray-400/30 text-gray-200 shadow-gray-500/20'
                : 'bg-green-500/20 border-green-400/30 text-green-200 shadow-green-500/20'
              : 'bg-slate-500/20 border-slate-400/30 text-slate-200'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isClockedIn
                  ? isOnBreak
                    ? 'bg-yellow-400 animate-pulse'
                    : isOnOff
                    ? 'bg-gray-400'
                    : 'bg-green-400 animate-pulse'
                  : 'bg-slate-400'
              }`}></div>
              <span>
                {isClockedIn
                  ? isOnBreak
                    ? 'On Break'
                    : isOnOff
                    ? 'Off Duty'
                    : 'Working'
                  : 'Off Duty'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Main Time Display */}
        <div className="text-center mb-8">
          <div className={`text-6xl lg:text-7xl font-mono font-bold mb-3 tracking-wider transition-all duration-300 relative ${
            isClockedIn
              ? isOnOff
                ? 'text-gray-400' // Paused during off
                : 'gradient-text animate-pulse' // Active working
              : 'text-white'
          }`}>
            {timeDisplay}
            {isClockedIn && isOnOff && (
              <div className="absolute -top-2 -right-2 text-yellow-400 animate-pulse">
                ⏸️
              </div>
            )}
          </div>
          <div className="text-lg opacity-90 font-medium">
            {isClockedIn
              ? isOnOff
                ? 'Timer Paused (Off Duty)'
                : 'Current Session'
              : 'Total Hours Today'
            }
          </div>
          {isClockedIn && (
            <div className={`mt-2 text-sm opacity-75 animate-fade-in ${
              isOnOff ? 'text-yellow-300' : ''
            }`}>
              {isOnOff ? 'Off duty since ' : 'Started at '}
              {isOnOff && todayEntry?.offs.length > 0
                ? format(todayEntry.offs[todayEntry.offs.length - 1].start, 'HH:mm')
                : todayEntry?.lastClockIn
                ? format(todayEntry.lastClockIn, 'HH:mm')
                : 'N/A'
              }
            </div>
          )}
        </div>

        {/* Work Type & Status Info */}
        {isClockedIn && (
          <div className="glass-effect rounded-xl p-4 mb-6 animate-scale-in">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="animate-slide-in-up">
                <div className="text-sm opacity-80 mb-1">Work Location</div>
                <div className="font-semibold flex items-center justify-center space-x-2">
                  <span>{currentWorkType === WorkType.Office ? '🏢' : currentWorkType === WorkType.Home ? '🏠' : '✈️'}</span>
                  <span>{currentWorkType}</span>
                </div>
              </div>
              <div className="animate-slide-in-up" style={{animationDelay: '0.1s'}}>
                <div className="text-sm opacity-80 mb-1">Total Today</div>
                <div className="font-semibold text-xl">{todayHours.toFixed(1)}h</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {!isClockedIn ? (
            <>
              {/* Work Type Selection */}
              <div className="animate-slide-in-up">
                <label className="block text-sm font-medium mb-3 opacity-90">Select Work Location</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedWorkType(WorkType.Office)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 font-medium transform hover:scale-105 active:scale-95 ${
                      selectedWorkType === WorkType.Office
                        ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30'
                        : 'glass-effect text-white hover:bg-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="text-2xl mb-1">🏢</div>
                    <div className="text-sm">Office</div>
                  </button>
                  <button
                    onClick={() => setSelectedWorkType(WorkType.Home)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 font-medium transform hover:scale-105 active:scale-95 ${
                      selectedWorkType === WorkType.Home
                        ? 'bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/30'
                        : 'glass-effect text-white hover:bg-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="text-2xl mb-1">🏠</div>
                    <div className="text-sm">Home</div>
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'ADD_BUSINESS_TRIP', payload: { date: today } })}
                    className="p-4 rounded-xl border-2 glass-effect text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300 font-medium transform hover:scale-105 active:scale-95"
                  >
                    <div className="text-2xl mb-1">✈️</div>
                    <div className="text-sm">Business</div>
                  </button>
                </div>
              </div>

              {/* Clock In Button */}
              <button
                onClick={handleClockIn}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-green-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95 animate-pulse-glow"
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className="text-xl animate-bounce">🟢</div>
                  <span className="text-lg">Clock In</span>
                  <div className="text-sm opacity-90">({selectedWorkType})</div>
                </div>
              </button>
            </>
          ) : (
            <>
              {/* Break/Off Controls */}
              <div className="space-y-3 animate-slide-in-up">
                {!isOnBreak && !isOnOff && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleStartBreak}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-yellow-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <div className="text-lg">☕</div>
                        <span>Break</span>
                      </div>
                      <div className="text-xs opacity-90">Counts as work</div>
                    </button>
                    <button
                      onClick={handleStartOff}
                      className="bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-gray-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <div className="text-lg">⏸️</div>
                        <span>Off Duty</span>
                      </div>
                      <div className="text-xs opacity-90">No work time</div>
                    </button>
                  </div>
                )}

                {isOnBreak && (
                  <button
                    onClick={handleEndBreak}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-green-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95 animate-pulse"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className="text-lg animate-bounce">▶️</div>
                      <span>Resume Work</span>
                    </div>
                  </button>
                )}

                {isOnOff && (
                  <button
                    onClick={handleEndOff}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95 animate-pulse"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className="text-lg animate-bounce">🔄</div>
                      <span>Back to Work</span>
                    </div>
                  </button>
                )}

                {/* Explanation */}
                <div className="text-center text-sm opacity-80 bg-white/10 rounded-lg p-2">
                  💡 <strong>Break</strong> = Working time | <strong>Off</strong> = Not working
                </div>
              </div>

              {/* Clock Out Button */}
              <button
                onClick={handleClockOut}
                className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-red-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className="text-xl">🔴</div>
                  <span className="text-lg">Clock Out</span>
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClockWidget;