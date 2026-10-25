/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BarChart3, Calendar, PieChart, Sparkles } from 'lucide-react';
import { DayEntry, Language, MonthlySummary } from '../types/timesheet';
import { translations } from '../utils/translations';

interface ChartsSectionProps {
  days: DayEntry[];
  summary: MonthlySummary;
  language: Language;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ days, summary, language }) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'daily' | 'calendar' | 'weekly'>('daily');

  // Compute weekly overtime buckets chronologically across the active cycle (e.g., 26th to 25th)
  const weeklyBuckets = [0, 1, 2, 3, 4].map((wIdx) => {
    const slice = days.slice(wIdx * 7, wIdx === 4 ? days.length : (wIdx + 1) * 7);
    const first = slice[0]?.displayDate || `${wIdx * 7 + 1}`;
    const last = slice[slice.length - 1]?.displayDate || '';
    return {
      label: slice.length > 0 ? `Week ${wIdx + 1} (${first}–${last})` : `Week ${wIdx + 1}`,
      regularMins: 0,
      otMins: 0,
      totalMins: 0,
    };
  });

  days.forEach((day, idx) => {
    const res = summary.dayResults[day.date];
    if (!res) return;
    const bucketIdx = Math.min(4, Math.floor(idx / 7));
    weeklyBuckets[bucketIdx].regularMins += res.regularMinutes;
    weeklyBuckets[bucketIdx].otMins += res.overtimeMinutes;
    weeklyBuckets[bucketIdx].totalMins += res.netMinutes;
  });

  // Calculate highest day net minutes for chart scaling
  const maxDayMinutes = Math.max(
    720, // default max 12 hours (720 mins)
    ...days.map((d) => summary.dayResults[d.date]?.netMinutes || 0)
  );

  return (
    <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
      {/* Tab controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Visual Shift & Overtime Analytics</h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1 rounded-lg transition ${
              activeTab === 'daily'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Shift Chart
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-3 py-1 rounded-lg transition ${
              activeTab === 'weekly'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Weekly Breakdown
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1 rounded-lg transition ${
              activeTab === 'calendar'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Calendar Grid
          </button>
        </div>
      </div>

      {/* Tab 1: Daily Shift Bar Chart */}
      {activeTab === 'daily' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Daily working hours distribution (Hover / Tap bar to view details)</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Regular
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Overtime
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-900 border border-blue-500 inline-block" /> Off Day
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="relative h-48 w-full bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 flex items-end gap-1 overflow-x-auto">
            {days.map((day) => {
              const res = summary.dayResults[day.date];
              const netMins = res ? res.netMinutes : 0;
              const regMins = res ? res.regularMinutes : 0;
              const otMins = res ? res.overtimeMinutes : 0;
              const isOff = res?.isWeeklyOff;
              const isFriday = day.dayOfWeek === 5;

              const totalHeightPct = Math.min(100, (netMins / maxDayMinutes) * 100);
              const regHeightPct = netMins > 0 ? (regMins / netMins) * 100 : 0;
              const otHeightPct = netMins > 0 ? (otMins / netMins) * 100 : 0;

              return (
                <div
                  key={day.date}
                  className="group relative flex-1 min-w-[20px] h-full flex flex-col justify-end items-center cursor-pointer"
                >
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute bottom-full mb-2 hidden group-hover:flex flex-col z-30 w-36 bg-slate-900 border border-slate-700 p-2 rounded-xl text-[10px] text-white shadow-2xl backdrop-blur-md">
                    <span className="font-bold text-sky-400">
                      {day.dayName}, {day.displayDate || `Day ${day.dayOfMonth}`}
                    </span>
                    <span>Status: {day.status}</span>
                    <span>Total: {(netMins / 60).toFixed(1)}h</span>
                    <span>Regular: {(regMins / 60).toFixed(1)}h</span>
                    <span className="text-amber-400 font-semibold">
                      Overtime: {(otMins / 60).toFixed(1)}h
                    </span>
                    {day.notes && <span className="text-slate-400 truncate">Note: {day.notes}</span>}
                  </div>

                  {/* The Bar */}
                  <div
                    style={{ height: `${Math.max(4, totalHeightPct)}%` }}
                    className={`w-full max-w-[26px] rounded-t-md overflow-hidden flex flex-col justify-end transition-all ${
                      netMins === 0
                        ? isOff
                          ? 'bg-blue-950/40 border-t-2 border-blue-600/60'
                          : 'bg-slate-900'
                        : ''
                    }`}
                  >
                    {otMins > 0 && (
                      <div
                        style={{ height: `${otHeightPct}%` }}
                        className="w-full bg-amber-500 hover:bg-amber-400 transition"
                      />
                    )}
                    {regMins > 0 && (
                      <div
                        style={{ height: `${regHeightPct}%` }}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 transition"
                      />
                    )}
                  </div>

                  {/* Day number */}
                  <span
                    className={`text-[9px] mt-1 tabular-nums ${
                      isFriday ? 'text-amber-400 font-bold' : 'text-slate-500 font-medium'
                    }`}
                  >
                    {day.dayOfMonth}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Weekly Overtime Breakdown */}
      {activeTab === 'weekly' && (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {weeklyBuckets.map((bucket, i) => {
            const totalHours = (bucket.totalMins / 60).toFixed(1);
            const otHours = (bucket.otMins / 60).toFixed(1);
            const regHours = (bucket.regularMins / 60).toFixed(1);

            return (
              <div
                key={i}
                className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>{bucket.label}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-extrabold text-white tabular-nums">
                    {totalHours}h
                  </span>
                  <span className="text-xs font-bold text-amber-400 tabular-nums">
                    +{otHours}h OT
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden flex">
                  <div
                    style={{
                      width: `${bucket.totalMins > 0 ? (bucket.regularMins / bucket.totalMins) * 100 : 0}%`,
                    }}
                    className="h-full bg-emerald-500"
                  />
                  <div
                    style={{
                      width: `${bucket.totalMins > 0 ? (bucket.otMins / bucket.totalMins) * 100 : 0}%`,
                    }}
                    className="h-full bg-amber-500"
                  />
                </div>
                <p className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Regular: {regHours}h</span>
                  <span className="text-amber-400 font-semibold">{otHours}h</span>
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Monthly Attendance Calendar Grid */}
      {activeTab === 'calendar' && (
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-slate-400 mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div className="text-amber-400">Fri (Off)</div>
            <div>Sat</div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank offset pads for first day of month */}
            {Array.from({ length: days[0]?.dayOfWeek || 0 }).map((_, idx) => (
              <div key={`pad-${idx}`} className="h-14 rounded-lg bg-slate-950/30 opacity-20" />
            ))}

            {days.map((day) => {
              const res = summary.dayResults[day.date];
              const netHours = res ? (res.netMinutes / 60).toFixed(1) : '0';
              const isOff = res?.isWeeklyOff;
              const hasOT = res && res.overtimeMinutes > 0;
              const isIncomplete = res?.isIncomplete;

              return (
                <div
                  key={day.date}
                  className={`h-14 p-1 rounded-xl border flex flex-col justify-between text-left transition ${
                    isIncomplete
                      ? 'bg-amber-950/30 border-amber-500/60 text-amber-300'
                      : isOff
                      ? 'bg-blue-950/20 border-blue-900/60 text-blue-300'
                      : hasOT
                      ? 'bg-slate-900 border-amber-600/40 text-slate-200'
                      : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tabular-nums">{day.dayOfMonth}</span>
                    {hasOT && (
                      <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1 rounded">
                        OT
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] tabular-nums font-semibold flex items-center justify-between">
                    <span className="text-slate-400">{parseFloat(netHours) > 0 ? `${netHours}h` : '--'}</span>
                    <span className="text-[8px] uppercase tracking-tighter opacity-80">
                      {day.status.slice(0, 3)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
