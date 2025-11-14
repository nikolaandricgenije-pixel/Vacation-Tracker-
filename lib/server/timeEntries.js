const LOG_PREFIX = '[lib/server/timeEntries]';

const toDateOrNull = value => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const ensureArray = value => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn(`${LOG_PREFIX} Failed to parse JSON array`, error);
      return [];
    }
  }

  if (typeof value === 'object') {
    return [value];
  }

  return [];
};

const normalizeIntervals = value =>
  ensureArray(value)
    .map(item => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const start = toDateOrNull(item.start ?? item.begin ?? item.from);
      const rawEnd = item.end ?? item.finish ?? item.to;
      const end = rawEnd ? toDateOrNull(rawEnd) : null;

      if (!start) {
        return null;
      }

      return end ? { start, end } : { start };
    })
    .filter(interval => interval !== null);

const startOfDayLocal = (date = new Date()) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const normalizeDbTimeEntry = entry => {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const normalizedDate = toDateOrNull(entry.date);
  if (!normalizedDate) {
    return null;
  }

  const normalizedLastClockIn = toDateOrNull(entry.lastClockIn);

  const totalWorkingMinutes = typeof entry.totalWorkingMinutes === 'number'
    ? entry.totalWorkingMinutes
    : Number.parseInt(entry.totalWorkingMinutes, 10) || 0;

  return {
    ...entry,
    date: normalizedDate,
    lastClockIn: normalizedLastClockIn,
    breaks: normalizeIntervals(entry.breaks),
    offs: normalizeIntervals(entry.offs),
    totalWorkingMinutes,
    isClockedIn: Boolean(entry.isClockedIn),
  };
};

const serializeInterval = interval => ({
  start: interval.start instanceof Date ? interval.start.toISOString() : new Date(interval.start).toISOString(),
  ...(interval.end
    ? {
        end: interval.end instanceof Date ? interval.end.toISOString() : new Date(interval.end).toISOString(),
      }
    : {}),
});

const serializeIntervalsForStorage = intervals =>
  Array.isArray(intervals) ? intervals.map(serializeInterval) : [];

const serializeTimeEntryForClient = entry => {
  const normalized = normalizeDbTimeEntry(entry);
  if (!normalized) {
    return null;
  }

  return {
    ...entry,
    date: normalized.date.toISOString().split('T')[0],
    lastClockIn: normalized.lastClockIn ? normalized.lastClockIn.toISOString() : null,
    breaks: normalized.breaks.map(serializeInterval),
    offs: normalized.offs.map(serializeInterval),
    totalWorkingMinutes: normalized.totalWorkingMinutes,
    isClockedIn: normalized.isClockedIn,
  };
};

const ensureTimeEntryArrays = entry => {
  const normalized = normalizeDbTimeEntry(entry);
  if (!normalized) {
    return {
      breaks: [],
      offs: [],
    };
  }

  return {
    breaks: normalized.breaks,
    offs: normalized.offs,
  };
};

const toDateOrNullSafe = toDateOrNull;

module.exports = {
  startOfDayLocal,
  normalizeDbTimeEntry,
  serializeIntervalsForStorage,
  serializeTimeEntryForClient,
  ensureTimeEntryArrays,
  toDateOrNullSafe,
};
