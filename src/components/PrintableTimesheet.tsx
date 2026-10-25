/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DayEntry, MonthSettings, MonthlySummary, UserProfile } from '../types/timesheet';
import { formatDuration } from '../utils/engine';

interface PrintableTimesheetProps {
  days: DayEntry[];
  summary: MonthlySummary;
  settings: MonthSettings;
  profile: UserProfile;
}

export const PrintableTimesheet: React.FC<PrintableTimesheetProps> = ({
  days,
  summary,
  settings,
  profile,
}) => {
  const monthName = new Date(settings.year, settings.month - 1, 1).toLocaleString('en-US', {
    month: 'long',
  });

  return (
    <div className="hidden print:block print:p-6 bg-white text-black font-sans text-[11px] leading-tight">
      {/* Header */}
      <div className="border-b-2 border-black pb-3 mb-3">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase">L&amp;T TIME CALCULATOR — OFFICIAL TIMESHEET</h1>
            <p className="text-xs font-semibold text-gray-700">8h Regular Duty + 1h Fixed Break (9h Shift) &amp; Overtime Record</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold bg-black text-white px-3 py-1 uppercase tracking-wider">
              {monthName} {settings.year}
            </span>
          </div>
        </div>

        {/* Worker & Project Metadata Grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3 text-xs">
          <div><strong>Employee:</strong> {profile.employeeName} ({profile.employeeId})</div>
          <div><strong>Company:</strong> {profile.companyName}</div>
          <div><strong>Designation:</strong> {profile.designation}</div>
          <div><strong>Project / Site:</strong> {profile.projectName}</div>
          <div><strong>Daily Duty Policy:</strong> {settings.dailyDutyMinutes / 60}h Duty + 1h Break ({settings.dailyDutyMinutes / 60 + 1}h Shift)</div>
          <div><strong>Weekly Off:</strong> Friday (Excluded from regular duty)</div>
          <div><strong>Allocation Method:</strong> {settings.calculationMethod === 'monthly_cap' ? 'Method A (Monthly Cap)' : 'Method B (Daily Overtime)'}</div>
          <div><strong>Scheduled Regular Hours:</strong> {(summary.scheduledRegularMinutes / 60).toFixed(1)} hrs</div>
        </div>
      </div>

      {/* Daily Records Table */}
      <table className="w-full border-collapse border border-black text-center text-[10px]">
        <thead>
          <tr className="bg-gray-200 border-b border-black font-bold">
            <th className="border border-black p-1 w-12">Date</th>
            <th className="border border-black p-1 w-20">Day</th>
            <th className="border border-black p-1 w-14">Check-In</th>
            <th className="border border-black p-1 w-14">Check-Out</th>
            <th className="border border-black p-1 w-12">Break</th>
            <th className="border border-black p-1 w-14">Net Hrs</th>
            <th className="border border-black p-1 w-14">Regular</th>
            <th className="border border-black p-1 w-14">Overtime</th>
            <th className="border border-black p-1 w-20">Status</th>
            <th className="border border-black p-1 text-left px-2">Remarks / Notes</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => {
            const res = summary.dayResults[day.date];
            const netMins = res ? res.netMinutes : 0;
            const regMins = res ? res.regularMinutes : 0;
            const otMins = res ? res.overtimeMinutes : 0;
            const isOff = res?.isWeeklyOff;

            return (
              <tr
                key={day.date}
                className={isOff ? 'bg-gray-100 font-medium' : 'border-b border-gray-300'}
              >
                <td className="border border-black p-0.5">{day.dayOfMonth}</td>
                <td className="border border-black p-0.5">{day.dayName}</td>
                <td className="border border-black p-0.5">{day.checkIn || '--'}</td>
                <td className="border border-black p-0.5">{day.checkOut || '--'}</td>
                <td className="border border-black p-0.5">{day.breakMinutes ? `${day.breakMinutes}m` : '0m'}</td>
                <td className="border border-black p-0.5 font-bold">
                  {res?.isIncomplete ? 'INCOMPLETE' : (netMins / 60).toFixed(1)}
                </td>
                <td className="border border-black p-0.5">{(regMins / 60).toFixed(1)}</td>
                <td className="border border-black p-0.5 font-bold">
                  {otMins > 0 ? (otMins / 60).toFixed(1) : '0.0'}
                </td>
                <td className="border border-black p-0.5 uppercase text-[9px]">{day.status}</td>
                <td className="border border-black p-0.5 text-left px-1 truncate max-w-[120px]">
                  {day.notes || ''}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-200 border-t-2 border-black font-black text-[11px]">
            <td colSpan={5} className="border border-black p-1 text-right pr-2">MONTHLY TOTALS:</td>
            <td className="border border-black p-1">{(summary.actualNetMinutes / 60).toFixed(1)}h</td>
            <td className="border border-black p-1">{(summary.monthlyRegularMinutes / 60).toFixed(1)}h</td>
            <td className="border border-black p-1">{(summary.monthlyOvertimeMinutes / 60).toFixed(1)}h</td>
            <td colSpan={2} className="border border-black p-1 text-left px-2">
              Attendance: {summary.presentDays} days | Off: {summary.weeklyOffDaysCount}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Summary KPI Block */}
      <div className="mt-4 grid grid-cols-4 gap-3 border border-black p-2 bg-gray-50 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-600 block">Total Worked</span>
          <span className="text-base font-black">{(summary.actualNetMinutes / 60).toFixed(1)} hrs</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-600 block">Scheduled Regular</span>
          <span className="text-base font-black">{(summary.scheduledRegularMinutes / 60).toFixed(1)} hrs</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-600 block">Regular Duty (Allocated)</span>
          <span className="text-base font-black">{(summary.monthlyRegularMinutes / 60).toFixed(1)} hrs ({summary.regularPercentage}%)</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-600 block">Overtime (Allocated)</span>
          <span className="text-base font-black">{(summary.monthlyOvertimeMinutes / 60).toFixed(1)} hrs ({summary.overtimePercentage}%)</span>
        </div>
      </div>

      {/* Sign-off signatures */}
      <div className="mt-8 pt-6 grid grid-cols-2 gap-12">
        <div className="border-t border-black pt-1">
          <p className="font-bold text-xs uppercase">Employee Signature</p>
          <p className="text-[10px] text-gray-600 mt-1">{profile.employeeName} | Date: _______________</p>
        </div>
        <div className="border-t border-black pt-1">
          <p className="font-bold text-xs uppercase">Supervisor / Project Manager Signature</p>
          <p className="text-[10px] text-gray-600 mt-1">Approval & Verification | Date: _______________</p>
        </div>
      </div>
    </div>
  );
};
