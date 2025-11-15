import { TimeEntry, WorkType } from '../types';

type RawDate = string | number | Date | null | undefined;
type RawBreak = { start?: RawDate; end?: RawDate } | null | undefined;
type RawEntry = {
  id?: string | number;
  employeeName?: string | null;
  date?: RawDate;
  workType?: string | null;
  lastClockIn?: RawDate;
  isClockedIn?: boolean | null;
  breaks?: RawBreak[] | string | null;
  offs?: RawBreak[] | string | null;
  totalWorkingMinutes?: number | string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const ensureArray = (value: RawEntry['breaks']): RawBreak[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('[timeEntries] Failed to parse JSON array', error);
      return [];
    }
  }

  return [];
};

const toDateOrNull = (value: RawDate): Date | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const coerceWorkType = (value: string | null | undefined): WorkType => {
  if (!value) {
    return WorkType.Office;
  }

  return (Object.values(WorkType) as string[]).includes(value)
    ? (value as WorkType)
    : WorkType.Office;
};

export const normalizeTimeEntries = (rawEntries: unknown): TimeEntry[] => {
  if (!Array.isArray(rawEntries)) {
    return [];
  }

  return rawEntries.reduce<TimeEntry[]>((normalized, entry) => {
    if (!isRecord(entry)) {
      return normalized;
    }

    const date = toDateOrNull(entry.date as RawDate);
    if (!date) {
      return normalized;
    }

    const lastClockIn = toDateOrNull(entry.lastClockIn as RawDate) ?? undefined;
    const breaks = ensureArray(entry.breaks as RawEntry['breaks'])
      .map(breakItem => {
        if (!isRecord(breakItem)) {
          return null;
        }

        const start = toDateOrNull(breakItem.start as RawDate);
        const end = toDateOrNull(breakItem.end as RawDate) ?? undefined;

        if (!start) {
          return null;
        }

        return end ? { start, end } : { start };
      })
      .filter((breakItem): breakItem is { start: Date; end?: Date } => breakItem !== null);

    const offs = ensureArray(entry.offs as RawEntry['offs'])
      .map(offItem => {
        if (!isRecord(offItem)) {
          return null;
        }

        const start = toDateOrNull(offItem.start as RawDate);
        const end = toDateOrNull(offItem.end as RawDate) ?? undefined;

        if (!start) {
          return null;
        }

        return end ? { start, end } : { start };
      })
      .filter((offItem): offItem is { start: Date; end?: Date } => offItem !== null);

    const totalWorkingMinutesRaw = entry.totalWorkingMinutes;
    const totalWorkingMinutes = typeof totalWorkingMinutesRaw === 'number'
      ? totalWorkingMinutesRaw
      : Number.parseInt(totalWorkingMinutesRaw as string, 10) || 0;

    normalized.push({
      id: entry.id !== undefined ? String(entry.id) : `${date.getTime()}-${entry.employeeName ?? 'unknown'}`,
      employeeName: entry.employeeName ?? 'Unknown',
      date,
      workType: coerceWorkType(entry.workType as string | null | undefined),
      lastClockIn,
      isClockedIn: Boolean(entry.isClockedIn),
      breaks,
      offs,
      totalWorkingMinutes,
    });

    return normalized;
  }, []);
};

export const toDateOrUndefined = (value: RawDate): Date | undefined => {
  const date = toDateOrNull(value);
  return date ?? undefined;
};
