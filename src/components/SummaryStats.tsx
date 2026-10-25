/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AlertCircle,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  Clock,
  Sparkles,
  TrendingUp,
  UserX,
  Zap,
} from 'lucide-react';
import { Language, MonthlySummary } from '../types/timesheet';
import { translations } from '../utils/translations';
import { formatDuration } from '../utils/engine';

interface SummaryStatsProps {
  summary: MonthlySummary;
  language: Language;
}

export const SummaryStats: React.FC<SummaryStatsProps> = ({ summary, language }) => {
  const t = translations[language];

  const totalHoursDecimal = (summary.actualNetMinutes / 60).toFixed(1);
  const regularHoursDecimal = (summary.monthlyRegularMinutes / 60).toFixed(1);
  const overtimeHoursDecimal = (summary.monthlyOvertimeMinutes / 60).toFixed(1);
  const scheduledHoursDecimal = (summary.scheduledRegularMinutes / 60).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Primary KPI Row - Electric Blue & Dark Navy Highlight Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Worked */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 p-4 border border-blue-500/30 shadow-lg shadow-blue-950/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.totalWorked}
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-sky-400 border border-blue-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
              {totalHoursDecimal}h
            </span>
            <span className="text-xs font-semibold text-sky-400 tabular-nums">
              {formatDuration(summary.actualNetMinutes, 'hm')}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5">
            <span>{summary.calendarDays} {t.allDays}</span>
            <span className="text-sky-300 font-medium">100% Activity</span>
          </div>
        </div>

        {/* Regular Duty Hours */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 p-4 border border-emerald-500/30 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.regularDuty}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight tabular-nums">
              {regularHoursDecimal}h
            </span>
            <span className="text-xs font-bold text-emerald-400/80 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60 tabular-nums">
              {summary.regularPercentage}%
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5">
            <span>{t.scheduledRegularHours}</span>
            <span className="font-semibold text-slate-200 tabular-nums">{scheduledHoursDecimal}h</span>
          </div>
        </div>

        {/* Overtime Hours */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/30 p-4 border border-amber-500/30 shadow-lg shadow-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.overtime}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight tabular-nums">
              {overtimeHoursDecimal}h
            </span>
            <span className="text-xs font-bold text-amber-400/80 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800/60 tabular-nums">
              {summary.overtimePercentage}%
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5">
            <span>{t.fridayOvertimeHours}</span>
            <span className="font-semibold text-amber-300 tabular-nums">
              {(summary.fridayOvertimeMinutes / 60).toFixed(1)}h
            </span>
          </div>
        </div>

        {/* Scheduled Regular Hours / Progress */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/30 p-4 border border-purple-500/30 shadow-lg shadow-purple-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.scheduledRegularHours}
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-300 tracking-tight tabular-nums">
              {scheduledHoursDecimal}h
            </span>
            <span className="text-xs font-semibold text-slate-400">
              ({summary.scheduledWorkingDays} days)
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5">
            <span>Quota Completion</span>
            <span className="font-semibold text-purple-300 tabular-nums">
              {summary.scheduledRegularMinutes > 0
                ? `${Math.min(100, Math.round((summary.monthlyRegularMinutes / summary.scheduledRegularMinutes) * 100))}%`
                : '100%'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress & Dynamic Allocation Bar */}
      <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800/80">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>
              {t.regularDuty}: <strong className="text-white tabular-nums">{regularHoursDecimal}h ({summary.regularPercentage}%)</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>
              {t.overtime}: <strong className="text-white tabular-nums">{overtimeHoursDecimal}h ({summary.overtimePercentage}%)</strong>
            </span>
          </div>
        </div>

        {/* Dynamic Dual-Bar Indicator */}
        <div className="w-full h-3 rounded-full bg-slate-950 flex overflow-hidden ring-1 ring-slate-800">
          <div
            style={{ width: `${summary.regularPercentage}%` }}
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
            title={`Regular Duty: ${summary.regularPercentage}%`}
          />
          <div
            style={{ width: `${summary.overtimePercentage}%` }}
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
            title={`Overtime: ${summary.overtimePercentage}%`}
          />
        </div>
      </div>

      {/* Secondary Attendance Counter Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {/* Attendance Days */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">{t.totalAttendance}</p>
            <p className="text-lg font-bold text-white tabular-nums">{summary.presentDays}</p>
          </div>
          <CalendarCheck className="w-4 h-4 text-emerald-400" />
        </div>

        {/* Weekly Off Days */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">{t.weeklyOffDays}</p>
            <p className="text-lg font-bold text-white tabular-nums">{summary.weeklyOffDaysCount}</p>
          </div>
          <CalendarDays className="w-4 h-4 text-blue-400" />
        </div>

        {/* Leave Days */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">{t.leaveDays}</p>
            <p className="text-lg font-bold text-white tabular-nums">{summary.leaveDaysCount}</p>
          </div>
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>

        {/* Absent Days */}
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">{t.absentDays}</p>
            <p className="text-lg font-bold text-red-400 tabular-nums">{summary.absentDaysCount}</p>
          </div>
          <UserX className="w-4 h-4 text-red-400" />
        </div>

        {/* Incomplete Entries */}
        <div
          className={`rounded-xl p-3 border flex items-center justify-between ${
            summary.incompleteEntriesCount > 0
              ? 'bg-amber-950/30 border-amber-600/50 text-amber-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400'
          }`}
        >
          <div>
            <p className="text-[10px] uppercase font-bold">{t.incompleteEntries}</p>
            <p className="text-lg font-bold tabular-nums">
              {summary.incompleteEntriesCount}
            </p>
          </div>
          <AlertCircle
            className={`w-4 h-4 ${
              summary.incompleteEntriesCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
