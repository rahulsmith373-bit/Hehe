/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AttendanceStatus =
  | 'present'
  | 'weekly_off'
  | 'public_holiday'
  | 'sick_leave'
  | 'annual_leave'
  | 'absent'
  | 'half_day';

export type WeeklyOffMode =
  | 'excluded_from_regular' // Option 1: Off day is excluded from regular duty; all worked hours on off day are overtime
  | 'included_in_regular';  // Option 2: Off day is included in regular duty; worked hours contribute to regular duty limit

export type CalculationMethod =
  | 'monthly_cap'   // Method A: Hours allocated up to scheduled monthly regular limit, excess is overtime
  | 'daily_overtime'; // Method B: Each scheduled day allocates up to daily duty limit as regular, excess is daily overtime

export type CycleMode =
  | '26_to_25' // L&T Payroll cycle: 26th of month to 25th of next month
  | '1_to_end'; // Standard calendar month: 1st to 28/29/30/31

export interface MonthSettings {
  year: number;
  month: number; // 1-12
  cycleMode?: CycleMode; // default: '26_to_25'
  dailyDutyMinutes: number; // default: 480 (8 hours net + 1h break = 9h shift)
  weeklyOffDays: number[]; // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday (default: [5])
  weeklyOffMode: WeeklyOffMode; // default: 'excluded_from_regular'
  calculationMethod: CalculationMethod; // default: 'daily_overtime'
  manualScheduledHoursOverride: number | null; // if user manually overrides scheduled monthly hours
  hourlyRate: number; // base hourly pay rate (optional, for payroll estimation)
  overtimeMultiplier: number; // default: 1.5
  currencySymbol: string; // e.g. "USD", "SAR", "AED", "PKR", "$"
}

export interface DayEntry {
  date: string; // YYYY-MM-DD
  dayOfMonth: number; // 1-31
  dayOfWeek: number; // 0-6 (0 = Sunday, 5 = Friday, etc.)
  dayName: string; // "Monday", "Friday", etc.
  displayDate?: string; // e.g. "26 Oct", "01 Nov"
  monthShort?: string; // e.g. "Oct", "Nov"
  checkIn: string; // "HH:MM" in 24h format, or ""
  checkOut: string; // "HH:MM" in 24h format, or ""
  breakMinutes: number; // default: 60 (1h fixed)
  status: AttendanceStatus;
  manualOvertimeMinutes?: number; // optional manual adjustment
  notes?: string;
  isCustomStatus?: boolean;
}

export interface DayCalculation {
  netMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  isIncomplete: boolean;
  isOvernight: boolean;
  isWeeklyOff: boolean;
  isHoliday: boolean;
  status: AttendanceStatus;
}

export interface MonthlySummary {
  calendarDays: number;
  scheduledWorkingDays: number;
  scheduledRegularMinutes: number;
  actualNetMinutes: number;
  monthlyRegularMinutes: number;
  monthlyOvertimeMinutes: number;
  unclassifiedMinutes: number;
  regularPercentage: number;
  overtimePercentage: number;
  
  // Attendance metrics
  presentDays: number;
  weeklyOffDaysCount: number;
  weeklyOffsWorkedCount: number;
  absentDaysCount: number;
  leaveDaysCount: number;
  publicHolidayDaysCount: number;
  incompleteEntriesCount: number;
  
  // Friday / Weekly Off specific breakdown
  totalFridays: number;
  fridaysWorked: number;
  fridaysOff: number;
  fridayTotalMinutesWorked: number;
  fridayOvertimeMinutes: number;

  // Pay estimate
  estimatedBasePay: number;
  estimatedOvertimePay: number;
  estimatedTotalPay: number;

  // Per day computed details
  dayResults: Record<string, DayCalculation>;
}

export interface UserProfile {
  employeeName: string;
  employeeId: string;
  companyName: string;
  projectName: string;
  designation: string;
  hourlyRate: number;
  overtimeMultiplier: number;
  currency: string;
}

export type TimeFormat = '12h' | '24h';
export type Language = 'en' | 'ur';
export type ThemeMode = 'dark' | 'light';
