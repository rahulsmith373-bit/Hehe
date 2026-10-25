/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CycleMode,
  DayCalculation,
  DayEntry,
  MonthSettings,
  MonthlySummary,
} from '../types/timesheet';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Returns a human-readable title for the active payroll period.
 * In '26_to_25' mode: e.g. "26 Oct 2026 – 25 Nov 2026" (or "26 Sep 2026 – 25 Oct 2026").
 */
export function formatCycleTitle(
  year: number,
  month: number,
  cycleMode: CycleMode = '26_to_25'
): string {
  if (cycleMode === '1_to_end') {
    const totalDays = getDaysInMonth(year, month);
    const mName = SHORT_MONTHS[month - 1] || 'Oct';
    return `01 ${mName} – ${totalDays} ${mName} ${year}`;
  }

  const startM = SHORT_MONTHS[month - 1] || 'Oct';
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endM = SHORT_MONTHS[nextMonth - 1] || 'Nov';

  if (year === nextYear) {
    return `26 ${startM} – 25 ${endM} ${year}`;
  }
  return `26 ${startM} ${year} – 25 ${endM} ${nextYear}`;
}

/**
 * Parses "HH:MM" (24h) string into total minutes from midnight.
 * Returns null if string is empty or invalid.
 */
export function parseTimeToMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(':');
  if (parts.length !== 2) return null;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/**
 * Converts total minutes from midnight into "HH:MM" 24-hour string.
 */
export function minutesToTimeString(totalMinutes: number): string {
  const norm = Math.max(0, totalMinutes % 1440);
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Formats a 24h "HH:MM" string for display based on 12h or 24h preference.
 */
export function formatDisplayTime(timeStr: string, is12h: boolean): string {
  if (!timeStr) return '--:--';
  if (!is12h) return timeStr;

  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return timeStr;

  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Formats duration minutes into human readable string.
 * Example: 630 mins -> "10.5h" or "10h 30m"
 */
export function formatDuration(
  minutes: number,
  style: 'decimal' | 'hm' | 'compact' = 'hm'
): string {
  if (minutes == null || isNaN(minutes) || minutes === 0) {
    return style === 'decimal' ? '0.0h' : '0h 0m';
  }

  const isNeg = minutes < 0;
  const absMins = Math.abs(minutes);
  const h = Math.floor(absMins / 60);
  const m = absMins % 60;

  if (style === 'decimal') {
    const dec = (absMins / 60).toFixed(1);
    return `${isNeg ? '-' : ''}${dec}h`;
  }

  if (style === 'compact') {
    if (m === 0) return `${isNeg ? '-' : ''}${h}h`;
    return `${isNeg ? '-' : ''}${h}h ${m}m`;
  }

  return `${isNeg ? '-' : ''}${h}h ${m}m`;
}

/**
 * Returns number of days in a given year and month (1-12).
 * Correctly accounts for leap years.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Calculates net working minutes for a single daily entry.
 * Accurately detects overnight shifts (e.g. 20:00 to 06:00 = 10h).
 * Incomplete entries (missing in or out) yield 0 confirmed minutes and isIncomplete: true.
 */
export function calculateDayShift(
  checkIn: string,
  checkOut: string,
  breakMinutes: number = 0
): {
  netMinutes: number;
  isIncomplete: boolean;
  isOvernight: boolean;
  rawDurationMinutes: number;
} {
  const inMins = parseTimeToMinutes(checkIn);
  const outMins = parseTimeToMinutes(checkOut);

  // If both missing, clean zero day (not incomplete, just no entry)
  if (inMins === null && outMins === null) {
    return {
      netMinutes: 0,
      isIncomplete: false,
      isOvernight: false,
      rawDurationMinutes: 0,
    };
  }

  // If one is present and the other is missing, mark incomplete!
  if (inMins === null || outMins === null) {
    return {
      netMinutes: 0,
      isIncomplete: true,
      isOvernight: false,
      rawDurationMinutes: 0,
    };
  }

  let duration: number;
  let isOvernight = false;

  if (outMins >= inMins) {
    duration = outMins - inMins;
  } else {
    // Overnight shift: cross midnight (e.g., 20:00 to 06:00)
    duration = 1440 - inMins + outMins;
    isOvernight = true;
  }

  const validBreak = Math.max(0, isNaN(breakMinutes) ? 0 : breakMinutes);
  const netMinutes = Math.max(0, duration - validBreak);

  return {
    netMinutes,
    isIncomplete: false,
    isOvernight,
    rawDurationMinutes: duration,
  };
}

/**
 * Initializes a full month/cycle's daily rows.
 * Supports:
 * - '26_to_25': Starts on 26th of `month` through end of `month`, then 1st to 25th of `month + 1`.
 * - '1_to_end': Standard 1st to end of `month`.
 */
export function generateMonthDays(
  year: number,
  month: number,
  weeklyOffDays: number[] = [5], // Default Friday (5)
  cycleMode: CycleMode = '1_to_end'
): DayEntry[] {
  const days: DayEntry[] = [];

  if (cycleMode === '26_to_25') {
    const startMonthDays = getDaysInMonth(year, month);
    const startMShort = SHORT_MONTHS[month - 1];

    // Part 1: 26th to end of current month
    for (let d = 26; d <= startMonthDays; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.getDay();
      const isWeeklyOff = weeklyOffDays.includes(dayOfWeek);
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

      days.push({
        date: dateStr,
        dayOfMonth: d,
        dayOfWeek,
        dayName: DAY_NAMES[dayOfWeek],
        displayDate: `${d.toString().padStart(2, '0')} ${startMShort}`,
        monthShort: startMShort,
        checkIn: '',
        checkOut: '',
        breakMinutes: 60, // Fixed 1h break (60 minutes)
        status: isWeeklyOff ? 'weekly_off' : 'present',
        notes: '',
      });
    }

    // Part 2: 1st to 25th of next month
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endMShort = SHORT_MONTHS[nextMonth - 1];

    for (let d = 1; d <= 25; d++) {
      const dateObj = new Date(nextYear, nextMonth - 1, d);
      const dayOfWeek = dateObj.getDay();
      const isWeeklyOff = weeklyOffDays.includes(dayOfWeek);
      const dateStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

      days.push({
        date: dateStr,
        dayOfMonth: d,
        dayOfWeek,
        dayName: DAY_NAMES[dayOfWeek],
        displayDate: `${d.toString().padStart(2, '0')} ${endMShort}`,
        monthShort: endMShort,
        checkIn: '',
        checkOut: '',
        breakMinutes: 60, // Fixed 1h break (60 minutes)
        status: isWeeklyOff ? 'weekly_off' : 'present',
        notes: '',
      });
    }

    return days;
  }

  // Standard '1_to_end' calendar month
  const totalDays = getDaysInMonth(year, month);
  const mShort = SHORT_MONTHS[month - 1];

  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 5 = Fri
    const isWeeklyOff = weeklyOffDays.includes(dayOfWeek);
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

    days.push({
      date: dateStr,
      dayOfMonth: d,
      dayOfWeek,
      dayName: DAY_NAMES[dayOfWeek],
      displayDate: `${d.toString().padStart(2, '0')} ${mShort}`,
      monthShort: mShort,
      checkIn: '',
      checkOut: '',
      breakMinutes: 60, // Fixed 1h break (60 minutes)
      status: isWeeklyOff ? 'weekly_off' : 'present',
      notes: '',
    });
  }

  return days;
}

/**
 * Core Monthly Calculation Engine.
 * Evaluates all days, prevents double-counting, allocates minutes between
 * Regular Duty, Overtime, and Unclassified, and handles all policies.
 */
export function calculateMonthlyTimesheet(
  days: DayEntry[],
  settings: MonthSettings
): MonthlySummary {
  const totalDays = days.length;
  const {
    dailyDutyMinutes,
    weeklyOffDays,
    weeklyOffMode,
    calculationMethod,
    manualScheduledHoursOverride,
    hourlyRate = 0,
    overtimeMultiplier = 1.5,
  } = settings;

  let scheduledWorkingDays = 0;
  let presentDays = 0;
  let weeklyOffDaysCount = 0;
  let weeklyOffsWorkedCount = 0;
  let absentDaysCount = 0;
  let leaveDaysCount = 0;
  let publicHolidayDaysCount = 0;
  let incompleteEntriesCount = 0;

  let totalFridays = 0;
  let fridaysWorked = 0;
  let fridaysOff = 0;
  let fridayTotalMinutesWorked = 0;
  let fridayOvertimeMinutes = 0;

  const dayResults: Record<string, DayCalculation> = {};
  let totalNetMinutes = 0;

  // Pass 1: Analyze daily shift metrics & attendance statuses
  for (const day of days) {
    const isWeeklyOff = weeklyOffDays.includes(day.dayOfWeek) || day.status === 'weekly_off';
    const isHoliday = day.status === 'public_holiday';
    const isFriday = day.dayOfWeek === 5;

    if (isFriday) totalFridays++;

    const shift = calculateDayShift(day.checkIn, day.checkOut, day.breakMinutes);

    if (shift.isIncomplete) {
      incompleteEntriesCount++;
    }

    const netMins = shift.netMinutes;
    totalNetMinutes += netMins;

    // Track attendance counts
    if (day.status === 'absent') absentDaysCount++;
    else if (day.status === 'sick_leave' || day.status === 'annual_leave') leaveDaysCount++;
    else if (isHoliday) publicHolidayDaysCount++;
    else if (isWeeklyOff) {
      weeklyOffDaysCount++;
      if (netMins > 0) weeklyOffsWorkedCount++;
    } else if (netMins > 0 || day.status === 'present' || day.status === 'half_day') {
      presentDays++;
    }

    // Friday specific tracking
    if (isFriday) {
      if (netMins > 0) {
        fridaysWorked++;
        fridayTotalMinutesWorked += netMins;
      } else {
        fridaysOff++;
      }
    }

    // Scheduled working day check:
    // Exclude weekly off days and public holidays according to settings
    const isScheduledWorkDay = !isWeeklyOff && !isHoliday && day.status !== 'absent';
    if (isScheduledWorkDay) {
      scheduledWorkingDays++;
    }

    // Temporary store day calculation
    dayResults[day.date] = {
      netMinutes: netMins,
      regularMinutes: 0,
      overtimeMinutes: 0,
      isIncomplete: shift.isIncomplete,
      isOvernight: shift.isOvernight,
      isWeeklyOff,
      isHoliday,
      status: day.status,
    };
  }

  // Calculate Scheduled Regular Minutes
  let scheduledRegularMinutes: number;
  if (manualScheduledHoursOverride != null && manualScheduledHoursOverride > 0) {
    scheduledRegularMinutes = Math.round(manualScheduledHoursOverride * 60);
  } else {
    scheduledRegularMinutes = scheduledWorkingDays * dailyDutyMinutes;
  }

  let monthlyRegularMinutes = 0;
  let monthlyOvertimeMinutes = 0;

  if (calculationMethod === 'monthly_cap') {
    // METHOD A: MONTHLY CAP
    // Regular hours are allocated up to the scheduled monthly regular-hours limit.
    // Hours beyond the limit become overtime.
    monthlyRegularMinutes = Math.min(totalNetMinutes, scheduledRegularMinutes);
    monthlyOvertimeMinutes = Math.max(0, totalNetMinutes - monthlyRegularMinutes);

    // Compute daily breakdown for display purposes under monthly cap:
    for (const day of days) {
      const res = dayResults[day.date];
      const netMins = res.netMinutes;

      if (netMins === 0) {
        res.regularMinutes = 0;
        res.overtimeMinutes = 0;
      } else if (res.isWeeklyOff && weeklyOffMode === 'excluded_from_regular') {
        // Off day is excluded from regular duty -> all worked hours are overtime
        res.regularMinutes = 0;
        res.overtimeMinutes = netMins;
      } else {
        // Normal day or off-day included: allocate up to daily duty limit
        const reg = Math.min(netMins, dailyDutyMinutes);
        res.regularMinutes = reg;
        res.overtimeMinutes = Math.max(0, netMins - reg);
      }

      // Add manual overtime adjustment if specified
      if (day.manualOvertimeMinutes) {
        res.overtimeMinutes = Math.max(0, res.overtimeMinutes + day.manualOvertimeMinutes);
      }

      if (day.dayOfWeek === 5) {
        fridayOvertimeMinutes += res.overtimeMinutes;
      }
    }
  } else {
    // METHOD B: DAILY OVERTIME
    // For each scheduled working day, allocate regular hours up to daily duty limit.
    // Hours beyond that limit become daily overtime.
    // On an off day:
    // - If off-day work counts as overtime (excluded_from_regular): classify all worked hours as overtime.
    // - If off-day work counts as regular duty (included_in_regular): allocate up to daily duty limit.
    let sumDailyRegular = 0;
    let sumDailyOvertime = 0;

    for (const day of days) {
      const res = dayResults[day.date];
      const netMins = res.netMinutes;

      if (netMins === 0) {
        res.regularMinutes = 0;
        res.overtimeMinutes = 0;
      } else if (res.isWeeklyOff) {
        if (weeklyOffMode === 'excluded_from_regular') {
          res.regularMinutes = 0;
          res.overtimeMinutes = netMins;
        } else {
          const reg = Math.min(netMins, dailyDutyMinutes);
          res.regularMinutes = reg;
          res.overtimeMinutes = Math.max(0, netMins - reg);
        }
      } else {
        // Scheduled working day
        const reg = Math.min(netMins, dailyDutyMinutes);
        res.regularMinutes = reg;
        res.overtimeMinutes = Math.max(0, netMins - reg);
      }

      // Add manual overtime adjustment if specified
      if (day.manualOvertimeMinutes) {
        res.overtimeMinutes = Math.max(0, res.overtimeMinutes + day.manualOvertimeMinutes);
      }

      sumDailyRegular += res.regularMinutes;
      sumDailyOvertime += res.overtimeMinutes;

      if (day.dayOfWeek === 5) {
        fridayOvertimeMinutes += res.overtimeMinutes;
      }
    }

    monthlyRegularMinutes = sumDailyRegular;
    monthlyOvertimeMinutes = sumDailyOvertime;
  }

  // Percentages
  const regularPercentage =
    totalNetMinutes > 0 ? Math.round((monthlyRegularMinutes / totalNetMinutes) * 100) : 0;
  const overtimePercentage =
    totalNetMinutes > 0 ? 100 - regularPercentage : 0;

  // Financial payout estimates
  const baseRatePerMinute = (hourlyRate || 0) / 60;
  const overtimeRatePerMinute = baseRatePerMinute * (overtimeMultiplier || 1.5);

  const estimatedBasePay = Math.round(monthlyRegularMinutes * baseRatePerMinute * 100) / 100;
  const estimatedOvertimePay = Math.round(monthlyOvertimeMinutes * overtimeRatePerMinute * 100) / 100;
  const estimatedTotalPay = Math.round((estimatedBasePay + estimatedOvertimePay) * 100) / 100;

  return {
    calendarDays: totalDays,
    scheduledWorkingDays,
    scheduledRegularMinutes,
    actualNetMinutes: totalNetMinutes,
    monthlyRegularMinutes,
    monthlyOvertimeMinutes,
    unclassifiedMinutes: 0,
    regularPercentage,
    overtimePercentage,

    presentDays,
    weeklyOffDaysCount,
    weeklyOffsWorkedCount,
    absentDaysCount,
    leaveDaysCount,
    publicHolidayDaysCount,
    incompleteEntriesCount,

    totalFridays,
    fridaysWorked,
    fridaysOff,
    fridayTotalMinutesWorked,
    fridayOvertimeMinutes,

    estimatedBasePay,
    estimatedOvertimePay,
    estimatedTotalPay,

    dayResults,
  };
}
