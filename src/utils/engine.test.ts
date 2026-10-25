/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDayShift,
  calculateMonthlyTimesheet,
  generateMonthDays,
  parseTimeToMinutes,
  formatDisplayTime,
  formatDuration,
  getDaysInMonth,
} from './engine';
import { DayEntry, MonthSettings } from '../types/timesheet';

test('TEST 1: Check-in 08:00, Check-out 19:00, Break 00:00, Daily limit 10 hours', () => {
  const shift = calculateDayShift('08:00', '19:00', 0);
  assert.equal(shift.netMinutes, 660, 'Net minutes must equal 660 (11 hours)');
  assert.equal(shift.netMinutes / 60, 11);
  assert.equal(shift.isIncomplete, false);

  // In daily calculation with 10h (600m) limit:
  const dayEntry: DayEntry = {
    date: '2026-10-01',
    dayOfMonth: 1,
    dayOfWeek: 4, // Thursday
    dayName: 'Thursday',
    checkIn: '08:00',
    checkOut: '19:00',
    breakMinutes: 0,
    status: 'present',
  };

  const settings: MonthSettings = {
    year: 2026,
    month: 10,
    dailyDutyMinutes: 600, // 10 hours
    weeklyOffDays: [5], // Friday
    weeklyOffMode: 'excluded_from_regular',
    calculationMethod: 'daily_overtime',
    manualScheduledHoursOverride: null,
    hourlyRate: 20,
    overtimeMultiplier: 1.5,
    currencySymbol: '$',
  };

  const summary = calculateMonthlyTimesheet([dayEntry], settings);
  const result = summary.dayResults['2026-10-01'];

  assert.equal(result.regularMinutes, 600, 'Regular hours must be 10 hours (600 mins)');
  assert.equal(result.overtimeMinutes, 60, 'Overtime hours must be 1 hour (60 mins)');
  assert.equal(result.netMinutes, 660, 'Net hours must be 11 hours (660 mins)');
});

test('TEST 2: 30 calendar days, 4 weekly off days, 10 daily regular hours, 500 actual working hours', () => {
  // Construct 30 days with 4 off days (26 working days)
  const days: DayEntry[] = [];
  for (let i = 1; i <= 30; i++) {
    const isOff = i % 7 === 5 && days.filter(d => d.status === 'weekly_off').length < 4;
    days.push({
      date: `2026-04-${i.toString().padStart(2, '0')}`,
      dayOfMonth: i,
      dayOfWeek: isOff ? 5 : 1,
      dayName: isOff ? 'Friday' : 'Monday',
      checkIn: '',
      checkOut: '',
      breakMinutes: 0,
      status: isOff ? 'weekly_off' : 'present',
    });
  }

  // Ensure exactly 4 weekly offs
  const offCount = days.filter(d => d.status === 'weekly_off').length;
  assert.equal(offCount, 4, 'Must have 4 off days');

  // Distribute 500 hours (30,000 minutes) across the days
  const totalTargetMinutes = 500 * 60; // 30,000 mins
  const activeDays = days.filter(d => d.status !== 'weekly_off'); // 26 days
  const baseMinsPerDay = Math.floor(totalTargetMinutes / activeDays.length);
  const remainder = totalTargetMinutes % activeDays.length;

  activeDays.forEach((d, idx) => {
    const mins = baseMinsPerDay + (idx < remainder ? 1 : 0);
    // Set synthetic checkIn / checkOut: 00:00 to mins
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    d.checkIn = '00:00';
    d.checkOut = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  });

  const settings: MonthSettings = {
    year: 2026,
    month: 4,
    dailyDutyMinutes: 600, // 10h
    weeklyOffDays: [5],
    weeklyOffMode: 'excluded_from_regular',
    calculationMethod: 'monthly_cap', // Method A
    manualScheduledHoursOverride: null,
    hourlyRate: 25,
    overtimeMultiplier: 1.5,
    currencySymbol: '$',
  };

  const summary = calculateMonthlyTimesheet(days, settings);

  assert.equal(summary.scheduledWorkingDays, 26, 'Scheduled days must equal 26');
  assert.equal(summary.scheduledRegularMinutes / 60, 260, 'Scheduled regular hours must equal 260');
  assert.equal(summary.actualNetMinutes / 60, 500, 'Actual hours must equal 500');
  assert.equal(summary.monthlyRegularMinutes / 60, 260, 'Monthly regular hours must equal 260');
  assert.equal(summary.monthlyOvertimeMinutes / 60, 240, 'Monthly overtime must equal 240');
});

test('TEST 3: Overnight shift Check-in 20:00, Check-out 06:00, Break 00:00', () => {
  const shift = calculateDayShift('20:00', '06:00', 0);
  assert.equal(shift.isOvernight, true, 'Should be flagged as overnight');
  assert.equal(shift.netMinutes, 600, 'Net hours must be 10 hours (600 mins)');
  assert.equal(shift.netMinutes / 60, 10);
  assert.equal(shift.isIncomplete, false);
});

test('TEST 4: Check-in 08:00, Check-out 19:00, Break 01:00 (60 mins)', () => {
  const shift = calculateDayShift('08:00', '19:00', 60);
  assert.equal(shift.rawDurationMinutes, 660, 'Raw duration is 11h');
  assert.equal(shift.netMinutes, 600, 'Net working hours after 1h break must equal 10 hours');
  assert.equal(shift.netMinutes / 60, 10);
  assert.equal(shift.isIncomplete, false);
});

test('TEST 5: Weekly off day with 9 actual working hours (all off-day work counts as overtime)', () => {
  const offDay: DayEntry = {
    date: '2026-10-02',
    dayOfMonth: 2,
    dayOfWeek: 5, // Friday
    dayName: 'Friday',
    checkIn: '08:00',
    checkOut: '17:00',
    breakMinutes: 0,
    status: 'weekly_off',
  };

  const settings: MonthSettings = {
    year: 2026,
    month: 10,
    dailyDutyMinutes: 600, // 10h
    weeklyOffDays: [5],
    weeklyOffMode: 'excluded_from_regular', // Off day excluded -> OT only
    calculationMethod: 'daily_overtime',
    manualScheduledHoursOverride: null,
    hourlyRate: 20,
    overtimeMultiplier: 1.5,
    currencySymbol: '$',
  };

  const summary = calculateMonthlyTimesheet([offDay], settings);
  const dayRes = summary.dayResults['2026-10-02'];

  assert.equal(dayRes.netMinutes, 540, 'Net hours is 9h');
  assert.equal(dayRes.regularMinutes, 0, 'Regular hours on off-day must be 0');
  assert.equal(dayRes.overtimeMinutes, 540, 'Overtime on off-day must be 9 hours (540 mins)');
});

test('TEST 6: A month with 5 Fridays (October 2026 has 5 Fridays: 2, 9, 16, 23, 30)', () => {
  // Let's generate days for October 2026
  const days = generateMonthDays(2026, 10, [5]);
  assert.equal(days.length, 31, 'October 2026 has 31 days');

  const settings: MonthSettings = {
    year: 2026,
    month: 10,
    dailyDutyMinutes: 600,
    weeklyOffDays: [5],
    weeklyOffMode: 'excluded_from_regular',
    calculationMethod: 'monthly_cap',
    manualScheduledHoursOverride: null,
    hourlyRate: 20,
    overtimeMultiplier: 1.5,
    currencySymbol: '$',
  };

  const summary = calculateMonthlyTimesheet(days, settings);
  assert.equal(summary.totalFridays, 5, 'Must count exactly 5 Fridays in October 2026');
});

test('TEST 7: A day with check-in but no check-out is marked incomplete and excluded from confirmed hours', () => {
  const incompleteShift = calculateDayShift('08:00', '', 0);
  assert.equal(incompleteShift.isIncomplete, true, 'Must mark incomplete');
  assert.equal(incompleteShift.netMinutes, 0, 'Must have 0 confirmed minutes');

  const dayEntry: DayEntry = {
    date: '2026-10-05',
    dayOfMonth: 5,
    dayOfWeek: 1,
    dayName: 'Monday',
    checkIn: '08:00',
    checkOut: '',
    breakMinutes: 0,
    status: 'present',
  };

  const settings: MonthSettings = {
    year: 2026,
    month: 10,
    dailyDutyMinutes: 600,
    weeklyOffDays: [5],
    weeklyOffMode: 'excluded_from_regular',
    calculationMethod: 'monthly_cap',
    manualScheduledHoursOverride: null,
    hourlyRate: 20,
    overtimeMultiplier: 1.5,
    currencySymbol: '$',
  };

  const summary = calculateMonthlyTimesheet([dayEntry], settings);
  assert.equal(summary.incompleteEntriesCount, 1, 'Should count 1 incomplete entry');
  assert.equal(summary.actualNetMinutes, 0, 'Confirmed net minutes must be 0');
});

test('Additional: Time formatters and leap year precision', () => {
  assert.equal(getDaysInMonth(2024, 2), 29, 'Leap year Feb 2024 has 29 days');
  assert.equal(getDaysInMonth(2025, 2), 28, 'Non-leap year Feb 2025 has 28 days');
  assert.equal(formatDisplayTime('19:00', true), '07:00 PM');
  assert.equal(formatDisplayTime('08:30', true), '08:30 AM');
  assert.equal(formatDisplayTime('19:00', false), '19:00');
  assert.equal(formatDuration(510, 'hm'), '8h 30m');
  assert.equal(formatDuration(510, 'decimal'), '8.5h');
});

test('TEST 8: L&T 8h Regular Duty + 1h Fixed Break (9h Shift: 08:00 to 17:00 = 8h Reg, 08:00 to 19:00 = 8h Reg + 2h OT)', () => {
  const days = generateMonthDays(2026, 10, [5]);
  assert.equal(days[0].breakMinutes, 60, 'Generated days must have 1h (60m) fixed break by default');

  // Day 1 (Thursday): 08:00 to 17:00 (9h span - 1h break = 8h net regular, 0h OT)
  days[0].checkIn = '08:00';
  days[0].checkOut = '17:00';

  // Day 3 (Saturday): 08:00 to 19:00 (11h span - 1h break = 10h net -> 8h regular + 2h OT)
  days[2].checkIn = '08:00';
  days[2].checkOut = '19:00';

  const settings: MonthSettings = {
    year: 2026,
    month: 10,
    dailyDutyMinutes: 480, // 8 hours regular duty
    weeklyOffDays: [5],
    weeklyOffMode: 'excluded_from_regular',
    calculationMethod: 'daily_overtime',
    manualScheduledHoursOverride: null,
    hourlyRate: 25,
    overtimeMultiplier: 1.5,
    currencySymbol: '$',
  };

  const summary = calculateMonthlyTimesheet(days, settings);
  const resDay1 = summary.dayResults['2026-10-01'];
  const resDay3 = summary.dayResults['2026-10-03'];

  assert.equal(resDay1.netMinutes, 480, '08:00 to 17:00 with 1h break must equal 8h (480m)');
  assert.equal(resDay1.regularMinutes, 480, 'Regular duty must be 8h');
  assert.equal(resDay1.overtimeMinutes, 0, 'Overtime must be 0h');

  assert.equal(resDay3.netMinutes, 600, '08:00 to 19:00 with 1h break must equal 10h (600m)');
  assert.equal(resDay3.regularMinutes, 480, 'Regular duty capped at 8h (480m)');
  assert.equal(resDay3.overtimeMinutes, 120, 'Overtime must be 2h (120m)');
});

test('TEST 9: 26th to 25th Cycle Generation (26 Oct to 25 Nov, 26 Sep to 25 Oct, 26 Dec to 25 Jan)', () => {
  // 26 Oct 2026 to 25 Nov 2026 -> 6 days in Oct (26..31) + 25 days in Nov (1..25) = 31 days
  const octToNov = generateMonthDays(2026, 10, [5], '26_to_25');
  assert.equal(octToNov.length, 31, '26 Oct to 25 Nov cycle must have 31 days');
  assert.equal(octToNov[0].date, '2026-10-26', 'First day must be 2026-10-26');
  assert.equal(octToNov[0].displayDate, '26 Oct', 'First displayDate must be 26 Oct');
  assert.equal(octToNov[5].date, '2026-10-31', '6th day must be 2026-10-31');
  assert.equal(octToNov[6].date, '2026-11-01', '7th day must be 2026-11-01');
  assert.equal(octToNov[6].displayDate, '01 Nov', '7th displayDate must be 01 Nov');
  assert.equal(octToNov[30].date, '2026-11-25', 'Last day must be 2026-11-25');
  assert.equal(octToNov[30].displayDate, '25 Nov', 'Last displayDate must be 25 Nov');

  // 26 Sep 2026 to 25 Oct 2026 -> 5 days in Sep (26..30) + 25 days in Oct (1..25) = 30 days
  const sepToOct = generateMonthDays(2026, 9, [5], '26_to_25');
  assert.equal(sepToOct.length, 30, '26 Sep to 25 Oct cycle must have 30 days');
  assert.equal(sepToOct[0].displayDate, '26 Sep', 'First displayDate must be 26 Sep');
  assert.equal(sepToOct[29].displayDate, '25 Oct', 'Last displayDate must be 25 Oct');

  // 26 Dec 2026 to 25 Jan 2027 -> crosses year boundary cleanly
  const decToJan = generateMonthDays(2026, 12, [5], '26_to_25');
  assert.equal(decToJan.length, 31, '26 Dec to 25 Jan cycle must have 31 days');
  assert.equal(decToJan[0].date, '2026-12-26', 'Starts 2026-12-26');
  assert.equal(decToJan[30].date, '2027-01-25', 'Ends 2027-01-25');
});


