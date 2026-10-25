/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { DayEntry, MonthSettings, MonthlySummary, UserProfile } from '../types/timesheet';
import { formatDuration } from './engine';

export function exportTimesheetToExcel(
  days: DayEntry[],
  summary: MonthlySummary,
  settings: MonthSettings,
  profile: UserProfile
): void {
  const monthName = new Date(settings.year, settings.month - 1, 1).toLocaleString('en-US', {
    month: 'long',
  });

  const headerRows = [
    ['L&T TIME CALCULATOR - MONTHLY TIMESHEET & OVERTIME REPORT'],
    ['Month & Year:', `${monthName} ${settings.year}`],
    ['Employee Name:', profile.employeeName, 'Employee ID:', profile.employeeId],
    ['Company:', profile.companyName, 'Project / Site:', profile.projectName],
    ['Designation:', profile.designation, 'Base Rate:', `${profile.currency}${profile.hourlyRate}/hr`],
    ['Daily Duty Limit:', `${settings.dailyDutyMinutes / 60} hrs (+ 1h Fixed Break = ${settings.dailyDutyMinutes / 60 + 1}h Shift)`, 'Overtime Rate:', `${settings.overtimeMultiplier}x Base`],
    ['Calculation Method:', settings.calculationMethod === 'monthly_cap' ? 'Method A (Monthly Cap)' : 'Method B (Daily Overtime)'],
    ['Weekly Off Policy:', settings.weeklyOffMode === 'excluded_from_regular' ? 'Off Day Excluded (All Off-Day Work = OT)' : 'Off Day Included in Regular Duty'],
    [],
    [
      'Date',
      'Day of Week',
      'Check-In',
      'Check-Out',
      'Break (mins)',
      'Net Hours (decimal)',
      'Net Hours (H:M)',
      'Regular Hours',
      'Overtime Hours',
      'Attendance Status',
      'Notes',
    ],
  ];

  const dataRows = days.map((day) => {
    const res = summary.dayResults[day.date];
    const netMins = res ? res.netMinutes : 0;
    const regMins = res ? res.regularMinutes : 0;
    const otMins = res ? res.overtimeMinutes : 0;

    let statusLabel: string = day.status;
    if (res?.isIncomplete) statusLabel += ' (INCOMPLETE)';

    return [
      day.date,
      day.dayName,
      day.checkIn || '--',
      day.checkOut || '--',
      day.breakMinutes || 0,
      (netMins / 60).toFixed(2),
      formatDuration(netMins, 'hm'),
      (regMins / 60).toFixed(2),
      (otMins / 60).toFixed(2),
      statusLabel,
      day.notes || '',
    ];
  });

  const summaryRows = [
    [],
    ['MONTHLY TOTALS & SUMMARY'],
    ['Total Actual Hours Worked:', (summary.actualNetMinutes / 60).toFixed(2), formatDuration(summary.actualNetMinutes, 'hm')],
    ['Scheduled Regular Hours:', (summary.scheduledRegularMinutes / 60).toFixed(2), formatDuration(summary.scheduledRegularMinutes, 'hm')],
    ['Regular Duty Hours Allocated:', (summary.monthlyRegularMinutes / 60).toFixed(2), `${summary.regularPercentage}% of total`],
    ['Overtime Hours Allocated:', (summary.monthlyOvertimeMinutes / 60).toFixed(2), `${summary.overtimePercentage}% of total`],
    ['Attendance Days:', summary.presentDays, 'Weekly Off Days:', summary.weeklyOffDaysCount],
    ['Fridays Worked:', summary.fridaysWorked, 'Friday Overtime Hours:', (summary.fridayOvertimeMinutes / 60).toFixed(2)],
    ['Estimated Base Pay:', `${profile.currency}${summary.estimatedBasePay.toFixed(2)}`],
    ['Estimated Overtime Pay:', `${profile.currency}${summary.estimatedOvertimePay.toFixed(2)}`],
    ['Estimated Total Payout:', `${profile.currency}${summary.estimatedTotalPay.toFixed(2)}`],
    [],
    ['SIGN-OFF & APPROVALS'],
    ['Employee Signature: _______________________', '', 'Supervisor Signature: _______________________'],
    ['Date: _____________________________________', '', 'Date: _____________________________________'],
  ];

  const wsData = [...headerRows, ...dataRows, ...summaryRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set nice column widths
  ws['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${monthName}_${settings.year}`);

  const fileName = `LnT_Timesheet_${profile.employeeName.replace(/\s+/g, '_')}_${settings.year}_${settings.month.toString().padStart(2, '0')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportTimesheetToCSV(
  days: DayEntry[],
  summary: MonthlySummary,
  settings: MonthSettings,
  profile: UserProfile
): void {
  const monthName = new Date(settings.year, settings.month - 1, 1).toLocaleString('en-US', {
    month: 'long',
  });

  const lines: string[] = [
    `"L&T Time Calculator - Monthly Timesheet & Overtime Report"`,
    `"Employee:","${profile.employeeName}","ID:","${profile.employeeId}"`,
    `"Company:","${profile.companyName}","Site/Project:","${profile.projectName}"`,
    `"Month:","${monthName} ${settings.year}","Scheduled Hours:","${(summary.scheduledRegularMinutes / 60).toFixed(2)}h"`,
    `"Total Worked:","${(summary.actualNetMinutes / 60).toFixed(2)}h","Regular Duty:","${(summary.monthlyRegularMinutes / 60).toFixed(2)}h","Overtime:","${(summary.monthlyOvertimeMinutes / 60).toFixed(2)}h"`,
    '',
    `"Date","Day","Check-In","Check-Out","Break (mins)","Net Hours","Regular Hours","Overtime","Status","Notes"`,
  ];

  days.forEach((day) => {
    const res = summary.dayResults[day.date];
    const netMins = res ? res.netMinutes : 0;
    const regMins = res ? res.regularMinutes : 0;
    const otMins = res ? res.overtimeMinutes : 0;
    lines.push(
      `"${day.date}","${day.dayName}","${day.checkIn || ''}","${day.checkOut || ''}","${day.breakMinutes || 0}","${(netMins / 60).toFixed(2)}","${(regMins / 60).toFixed(2)}","${(otMins / 60).toFixed(2)}","${day.status}${res?.isIncomplete ? ' (INCOMPLETE)' : ''}","${(day.notes || '').replace(/"/g, '""')}"`
    );
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LnT_Timesheet_${settings.year}_${settings.month.toString().padStart(2, '0')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareTimesheetSummary(
  summary: MonthlySummary,
  settings: MonthSettings,
  profile: UserProfile
): Promise<boolean> {
  const monthName = new Date(settings.year, settings.month - 1, 1).toLocaleString('en-US', {
    month: 'long',
  });

  const text = `DutyMate Pro Timesheet: ${profile.employeeName} (${monthName} ${settings.year})\n` +
    `Total Worked: ${(summary.actualNetMinutes / 60).toFixed(1)}h\n` +
    `Regular Duty: ${(summary.monthlyRegularMinutes / 60).toFixed(1)}h\n` +
    `Overtime: ${(summary.monthlyOvertimeMinutes / 60).toFixed(1)}h\n` +
    `Scheduled Duty: ${(summary.scheduledRegularMinutes / 60).toFixed(1)}h\n` +
    `Attendance Days: ${summary.presentDays} | Fridays Worked: ${summary.fridaysWorked}\n` +
    `Est. Total Payout: ${profile.currency}${summary.estimatedTotalPay.toFixed(2)}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Timesheet - ${profile.employeeName} - ${monthName} ${settings.year}`,
        text,
      });
      return true;
    } catch {
      return false;
    }
  } else {
    // Copy to clipboard fallback
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}
