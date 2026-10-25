/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, CheckCircle2, Clock, Info, Shield, Zap } from 'lucide-react';
import { Language, MonthSettings, MonthlySummary, WeeklyOffMode } from '../types/timesheet';
import { translations } from '../utils/translations';
import { formatDuration } from '../utils/engine';

interface WeeklyOffPanelProps {
  summary: MonthlySummary;
  settings: MonthSettings;
  onUpdateSettings: (updates: Partial<MonthSettings>) => void;
  language: Language;
}

export const WeeklyOffPanel: React.FC<WeeklyOffPanelProps> = ({
  summary,
  settings,
  onUpdateSettings,
  language,
}) => {
  const t = translations[language];

  const isFridayConfiguredOff = settings.weeklyOffDays.includes(5);
  const isExcluded = settings.weeklyOffMode === 'excluded_from_regular';

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/30 rounded-2xl p-5 border border-slate-800 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600/20 text-sky-400 border border-blue-500/30">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
              <span>{t.fridaySummaryTitle}</span>
              <span className="text-[10px] font-semibold bg-blue-950 text-blue-300 px-2 py-0.5 rounded-full border border-blue-800">
                Dynamic Calendar Engine
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Precise off-day scheduling and overtime calculation without guesswork
            </p>
          </div>
        </div>

        {/* Quick Mode Toggle Pill */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => onUpdateSettings({ weeklyOffMode: 'excluded_from_regular' as WeeklyOffMode })}
            className={`px-2.5 py-1 rounded-lg transition ${
              isExcluded
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Off-Day = 100% OT
          </button>
          <button
            onClick={() => onUpdateSettings({ weeklyOffMode: 'included_in_regular' as WeeklyOffMode })}
            className={`px-2.5 py-1 rounded-lg transition ${
              !isExcluded
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Included in Duty
          </button>
        </div>
      </div>

      {/* 5 Stats Cards for Friday / Off-day */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Fridays */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <p className="text-[11px] font-medium text-slate-400">{t.totalFridaysInMonth}</p>
          <p className="text-xl font-bold text-white mt-1 tabular-nums">
            {summary.totalFridays}{' '}
            <span className="text-xs font-normal text-slate-400">Fridays</span>
          </p>
          <p className="text-[10px] text-sky-400 mt-0.5">Calculated from calendar</p>
        </div>

        {/* Fridays Worked */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <p className="text-[11px] font-medium text-slate-400">{t.fridaysWorked}</p>
          <p className="text-xl font-bold text-amber-400 mt-1 tabular-nums">
            {summary.fridaysWorked}{' '}
            <span className="text-xs font-normal text-slate-400">Days</span>
          </p>
          <p className="text-[10px] text-amber-300 mt-0.5">
            {summary.fridaysWorked > 0 ? 'Overtime duties performed' : 'No Friday shifts'}
          </p>
        </div>

        {/* Fridays Off */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <p className="text-[11px] font-medium text-slate-400">{t.fridaysOff}</p>
          <p className="text-xl font-bold text-emerald-400 mt-1 tabular-nums">
            {summary.fridaysOff}{' '}
            <span className="text-xs font-normal text-slate-400">Rested</span>
          </p>
          <p className="text-[10px] text-emerald-300 mt-0.5">Full weekly off taken</p>
        </div>

        {/* Total Worked on Fridays */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          <p className="text-[11px] font-medium text-slate-400">{t.fridayHoursWorked}</p>
          <p className="text-xl font-bold text-white mt-1 tabular-nums">
            {(summary.fridayTotalMinutesWorked / 60).toFixed(1)}h
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
            {formatDuration(summary.fridayTotalMinutesWorked, 'hm')}
          </p>
        </div>

        {/* Friday Overtime Hours */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-amber-600/40 col-span-2 sm:col-span-1">
          <p className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            {t.fridayOvertimeHours}
          </p>
          <p className="text-xl font-bold text-amber-400 mt-1 tabular-nums">
            {(summary.fridayOvertimeMinutes / 60).toFixed(1)}h
          </p>
          <p className="text-[10px] text-amber-300/80 mt-0.5">
            {isExcluded ? '100% categorized as OT' : 'Exceeding regular limit'}
          </p>
        </div>
      </div>

      {/* Policy Explanation Note */}
      <div className="mt-3.5 flex items-center gap-2 text-xs text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
        <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />
        <span>
          Current Policy:{' '}
          <strong className="text-slate-200">
            {isExcluded
              ? 'Friday is treated as an Off Day. All hours worked on Friday are classified as Overtime.'
              : 'Friday is included in scheduled duty. Regular duty cap applies before overtime.'}
          </strong>
        </span>
      </div>
    </div>
  );
};
