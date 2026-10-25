/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CycleMode, DayEntry, MonthSettings, UserProfile } from '../types/timesheet';
import { generateMonthDays } from './engine';

const SETTINGS_KEY = 'lnt_settings_v4';
const PROFILE_KEY = 'lnt_profile_v4';
const MONTHS_PREFIX = 'lnt_month_v4_';

export const DEFAULT_SETTINGS: MonthSettings = {
  year: 2026,
  month: 9, // 26 Sep – 25 Oct 2026 (L&T Oct-26 Payroll Cycle)
  cycleMode: '26_to_25', // Default L&T Payroll cycle: 26th to 25th
  dailyDutyMinutes: 480, // 8 hours regular duty + 1 hour break = 9 hours total shift
  weeklyOffDays: [5], // Friday default
  weeklyOffMode: 'excluded_from_regular', // Option 1 default: off day excluded from regular duty
  calculationMethod: 'daily_overtime', // Daily OT + Off-day OT clarity for 8h+1h shifts
  manualScheduledHoursOverride: null,
  hourlyRate: 25,
  overtimeMultiplier: 1.5,
  currencySymbol: 'SAR ',
};

export const DEFAULT_PROFILE: UserProfile = {
  employeeName: 'ASAD ALI',
  employeeId: 'SA24M013',
  companyName: 'L&T Saudia',
  projectName: 'SADAWI PV BSP',
  designation: 'ELEC (Electrical Technician)',
  hourlyRate: 25,
  overtimeMultiplier: 1.5,
  currency: 'SAR ',
};

// Exact 30 rows from the uploaded L&T Saudia Oct-26 sheet (26-Sep-2026 to 25-Oct-2026)
export const ASAD_ALI_OCT26_ROWS: Array<{
  dayOfMonth: number;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'weekly_off';
  notes?: string;
}> = [
  { dayOfMonth: 26, checkIn: '05:30', checkOut: '20:00', status: 'present', notes: '26-Sep-2026 (N)' },
  { dayOfMonth: 27, checkIn: '05:30', checkOut: '20:00', status: 'present', notes: '27-Sep-2026 (N)' },
  { dayOfMonth: 28, checkIn: '05:30', checkOut: '20:00', status: 'present', notes: '28-Sep-2026 (N)' },
  { dayOfMonth: 29, checkIn: '05:30', checkOut: '20:00', status: 'present', notes: '29-Sep-2026 (N)' },
  { dayOfMonth: 30, checkIn: '05:30', checkOut: '20:00', status: 'present', notes: '30-Sep-2026 (N)' },
  { dayOfMonth: 1, checkIn: '05:30', checkOut: '20:00', status: 'present', notes: '1-Oct-2026 (N)' },
  { dayOfMonth: 2, checkIn: '06:00', checkOut: '12:00', status: 'weekly_off', notes: '2-Oct-2026 (F - Friday OT)' },
  { dayOfMonth: 3, checkIn: '05:30', checkOut: '20:00', status: 'present', notes: '3-Oct-2026 (N)' },
  { dayOfMonth: 4, checkIn: '05:30', checkOut: '20:00', status: 'present', notes: '4-Oct-2026 (N)' },
  { dayOfMonth: 5, checkIn: '05:30', checkOut: '20:00', status: 'present', notes: '5-Oct-2026 (N)' },
  { dayOfMonth: 6, checkIn: '05:30', checkOut: '20:00', status: 'present', notes: '6-Oct-2026 (N)' },
  { dayOfMonth: 7, checkIn: '05:30', checkOut: '19:00', status: 'present', notes: '7-Oct-2026 (N)' },
  { dayOfMonth: 8, checkIn: '05:30', checkOut: '19:00', status: 'present', notes: '8-Oct-2026 (N)' },
  { dayOfMonth: 9, checkIn: '', checkOut: '', status: 'weekly_off', notes: '9-Oct-2026 (F - Weekly Off)' },
  { dayOfMonth: 10, checkIn: '05:30', checkOut: '20:00', status: 'present', notes: '10-Oct-2026 (N)' },
  { dayOfMonth: 11, checkIn: '15:00', checkOut: '07:00', status: 'present', notes: '11-Oct-2026 (Night Shift)' },
  { dayOfMonth: 12, checkIn: '15:00', checkOut: '07:00', status: 'present', notes: '12-Oct-2026 (Night Shift)' },
  { dayOfMonth: 13, checkIn: '15:00', checkOut: '07:00', status: 'present', notes: '13-Oct-2026 (Night Shift)' },
  { dayOfMonth: 14, checkIn: '15:00', checkOut: '07:00', status: 'present', notes: '14-Oct-2026 (Night Shift)' },
  { dayOfMonth: 15, checkIn: '15:00', checkOut: '07:00', status: 'present', notes: '15-Oct-2026 (Night Shift)' },
  { dayOfMonth: 16, checkIn: '06:00', checkOut: '14:00', status: 'weekly_off', notes: '16-Oct-2026 (F - Friday OT)' },
  { dayOfMonth: 17, checkIn: '15:00', checkOut: '07:00', status: 'present', notes: '17-Oct-2026 (Night Shift)' },
  { dayOfMonth: 18, checkIn: '15:00', checkOut: '07:00', status: 'present', notes: '18-Oct-2026 (Night Shift)' },
  { dayOfMonth: 19, checkIn: '15:00', checkOut: '07:00', status: 'present', notes: '19-Oct-2026 (Night Shift)' },
  { dayOfMonth: 20, checkIn: '15:00', checkOut: '07:00', status: 'present', notes: '20-Oct-2026 (Night Shift)' },
  { dayOfMonth: 21, checkIn: '05:30', checkOut: '19:00', status: 'present', notes: '21-Oct-2026 (N)' },
  { dayOfMonth: 22, checkIn: '05:30', checkOut: '20:00', status: 'present', notes: '22-Oct-2026 (N)' },
  { dayOfMonth: 23, checkIn: '', checkOut: '', status: 'weekly_off', notes: '23-Oct-2026 (F - Weekly Off, row 28)' },
  { dayOfMonth: 24, checkIn: '05:30', checkOut: '', status: 'present', notes: '24-Oct-2026 (Row 29: In 05:30, Out blank)' },
  { dayOfMonth: 25, checkIn: '05:30', checkOut: '19:00', status: 'present', notes: '25-Oct-2026 (Row 30: In 05:30, Out 19:00)' },
];

export function getStoredSettings(): MonthSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to parse settings from storage', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: MonthSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to storage', e);
  }
}

export function getStoredProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PROFILE, ...parsed };
    }
  } catch (e) {
    console.error('Failed to parse profile from storage', e);
  }
  return { ...DEFAULT_PROFILE };
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile to storage', e);
  }
}

export function getMonthStorageKey(
  year: number,
  month: number,
  cycleMode: CycleMode = '26_to_25'
): string {
  return `${MONTHS_PREFIX}${cycleMode}_${year}_${month.toString().padStart(2, '0')}`;
}

export function getStoredDays(
  year: number,
  month: number,
  weeklyOffDays: number[],
  cycleMode: CycleMode = '26_to_25'
): DayEntry[] {
  const key = getMonthStorageKey(year, month, cycleMode);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse month days from storage', e);
  }

  // Generate month/cycle (26th to 25th by default) with 8h duty + 1h fixed break (9h total shift)
  const generated = generateMonthDays(year, month, weeklyOffDays, cycleMode);

  if (year === 2026 && month === 9 && cycleMode === '26_to_25') {
    // Populate exact rows from Asad Ali's Oct-26 (26 Sep – 25 Oct 2026) L&T Saudia sheet
    generated.forEach((d, idx) => {
      const row = ASAD_ALI_OCT26_ROWS[idx];
      d.breakMinutes = 60;
      if (row) {
        d.checkIn = row.checkIn;
        d.checkOut = row.checkOut;
        d.status = row.status;
        d.notes = row.notes;
      }
    });
  } else {
    generated.forEach((d, idx) => {
      d.breakMinutes = 60; // Fixed 1h break across all days
      if (d.status === 'weekly_off') {
        if (idx === 6) {
          d.checkIn = '06:00';
          d.checkOut = '12:00';
          d.breakMinutes = 60;
          d.notes = 'Friday special site duty';
        }
      } else {
        d.checkIn = '05:30';
        d.checkOut = idx % 4 === 0 ? '19:00' : '20:00';
        d.breakMinutes = 60;
      }
    });
  }

  saveDays(year, month, generated, cycleMode);
  return generated;
}

export function saveDays(
  year: number,
  month: number,
  days: DayEntry[],
  cycleMode: CycleMode = '26_to_25'
): void {
  const key = getMonthStorageKey(year, month, cycleMode);
  try {
    localStorage.setItem(key, JSON.stringify(days));
  } catch (e) {
    console.error('Failed to save month days to storage', e);
  }
}

export function exportAllDataAsJSON(): string {
  const backup: Record<string, unknown> = {
    settings: getStoredSettings(),
    profile: getStoredProfile(),
    months: {},
    exportDate: new Date().toISOString(),
    version: '3.0.0',
  };

  const months: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(MONTHS_PREFIX)) {
      try {
        months[k] = JSON.parse(localStorage.getItem(k) || '[]');
      } catch {
        // ignore
      }
    }
  }
  backup.months = months;

  return JSON.stringify(backup, null, 2);
}

export function importAllDataFromJSON(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
    if (data.profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
    if (data.months && typeof data.months === 'object') {
      for (const [k, val] of Object.entries(data.months)) {
        if (k.startsWith(MONTHS_PREFIX)) {
          localStorage.setItem(k, JSON.stringify(val));
        }
      }
    }
    return true;
  } catch (e) {
    console.error('Failed to import JSON backup', e);
    return false;
  }
}
