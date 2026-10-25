/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  Lock,
  Moon,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  AttendanceStatus,
  DayEntry,
  Language,
  MonthlySummary,
  TimeFormat,
} from '../types/timesheet';
import { translations } from '../utils/translations';
import { formatDuration } from '../utils/engine';

interface DailyTableProps {
  days: DayEntry[];
  summary: MonthlySummary;
  language: Language;
  timeFormat: TimeFormat;
  weeklyOffDays: number[];
  onUpdateDay: (date: string, updates: Partial<DayEntry>) => void;
  onApplyCheckInToAll: (checkInTime: string, checkOutTime?: string) => void;
  onCopyPreviousDay: (currentIndex: number) => void;
  onOpenEditModal: (day: DayEntry) => void;
  onOpenScanner: () => void;
}

const STATUS_OPTIONS: { id: AttendanceStatus; label: string }[] = [
  { id: 'present', label: 'Present' },
  { id: 'weekly_off', label: 'Weekly Off' },
  { id: 'public_holiday', label: 'Public Holiday' },
  { id: 'sick_leave', label: 'Sick Leave' },
  { id: 'annual_leave', label: 'Annual Leave' },
  { id: 'absent', label: 'Absent' },
  { id: 'half_day', label: 'Half Day' },
];

/**
 * Helper to normalize any user-typed or scanned time into strict 24-hour "HH:MM" (00:00 - 23:59)
 * Never uses AM/PM.
 */
export function normalizeTo24hTime(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // Case 1: H:MM or HH:MM or H.MM or HH.MM
  const colonMatch = trimmed.match(/^(\d{1,2})[:.](\d{1,2})$/);
  if (colonMatch) {
    const h = parseInt(colonMatch[1], 10);
    const m = parseInt(colonMatch[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
    return null;
  }

  // Case 2: 3 or 4 digits without colon, e.g. "530" -> "05:30", "2000" -> "20:00"
  if (/^\d{3,4}$/.test(trimmed)) {
    const padded = trimmed.padStart(4, '0');
    const h = parseInt(padded.slice(0, 2), 10);
    const m = parseInt(padded.slice(2, 4), 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
    return null;
  }

  // Case 3: 1 or 2 digits hour only, e.g. "7" -> "07:00", "20" -> "20:00"
  if (/^\d{1,2}$/.test(trimmed)) {
    const h = parseInt(trimmed, 10);
    if (h >= 0 && h <= 23) {
      return `${h.toString().padStart(2, '0')}:00`;
    }
  }

  return null;
}

/**
 * Glitch-free Strict 24-Hour Time Input component (HH:MM, NO AM/PM).
 * Works identically across Android, iOS, and Desktop regardless of device AM/PM locale.
 */
interface BufferedTimeInputProps {
  value: string;
  onChange: (newVal: string) => void;
  isIncompleteWarning?: boolean;
  ariaLabel: string;
}

export const BufferedTimeInput: React.FC<BufferedTimeInputProps> = React.memo(
  ({ value, onChange, isIncompleteWarning, ariaLabel }) => {
    const [localVal, setLocalVal] = useState<string>(value || '');
    const [isFocused, setIsFocused] = useState(false);

    // Sync from parent when not actively focused (e.g. Batch Fill, Apply All, Scan, Undo)
    useEffect(() => {
      if (!isFocused) {
        setLocalVal(value || '');
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Allow only digits and colon/dot
      let next = e.target.value.replace(/[^\d:.]/g, '');
      // Auto-insert colon if user typed 4 raw digits like "0530" or "2000"
      if (/^\d{4}$/.test(next)) {
        next = `${next.slice(0, 2)}:${next.slice(2, 4)}`;
      }
      if (next.length > 5) {
        next = next.slice(0, 5);
      }
      setLocalVal(next);

      if (next === '') {
        onChange('');
      } else if (/^\d{2}:\d{2}$/.test(next)) {
        const formatted = normalizeTo24hTime(next);
        if (formatted !== null) {
          onChange(formatted);
        }
      }
    };

    const commitValue = () => {
      setIsFocused(false);
      if (!localVal.trim()) {
        if (value !== '') onChange('');
        setLocalVal('');
        return;
      }
      const formatted = normalizeTo24hTime(localVal);
      if (formatted !== null) {
        setLocalVal(formatted);
        if (formatted !== value) {
          onChange(formatted);
        }
      } else {
        // Revert to last valid value if invalid
        setLocalVal(value || '');
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur();
      }
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="text"
          inputMode="numeric"
          placeholder="--:--"
          maxLength={5}
          value={localVal}
          onFocus={(e) => {
            setIsFocused(true);
            e.currentTarget.select();
          }}
          onChange={handleChange}
          onBlur={commitValue}
          onKeyDown={handleKeyDown}
          aria-label={ariaLabel}
          className={`bg-slate-950/95 border text-xs rounded-lg pl-2.5 pr-7 py-1.5 font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-[92px] text-center tabular-nums ${
            isIncompleteWarning
              ? 'border-red-500 text-red-300'
              : localVal
              ? 'border-slate-700 text-white'
              : 'border-slate-800 text-slate-500'
          }`}
        />
        <span className="pointer-events-none absolute right-1.5 text-[8px] font-bold text-slate-500 uppercase">
          24h
        </span>
      </div>
    );
  }
);

export const DailyTable: React.FC<DailyTableProps> = ({
  days,
  summary,
  language,
  weeklyOffDays,
  onUpdateDay,
  onApplyCheckInToAll,
  onCopyPreviousDay,
  onOpenEditModal,
  onOpenScanner,
}) => {
  const t = translations[language];
  const [filter, setFilter] = useState<'all' | 'overtime' | 'incomplete' | 'weekly_off'>('all');

  // Master Check-In Control state (defaults to 05:30 Check-In & 20:00 Check-Out in 24h format)
  const [masterCheckIn, setMasterCheckIn] = useState<string>('05:30');
  const [masterCheckOut, setMasterCheckOut] = useState<string>('20:00');
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);

  const handleMasterCheckInApply = () => {
    if (!masterCheckIn) return;
    onApplyCheckInToAll(masterCheckIn);
    setAppliedBanner(
      `24H Check-In (${masterCheckIn}) + 1h Fixed Break applied to all working days (Fridays skipped automatically)!`
    );
    setTimeout(() => setAppliedBanner(null), 4000);
  };

  const handleMasterFullShiftApply = () => {
    if (!masterCheckIn || !masterCheckOut) return;
    onApplyCheckInToAll(masterCheckIn, masterCheckOut);
    setAppliedBanner(
      `24H Shift (${masterCheckIn} – ${masterCheckOut}, 1h Break) applied to all working days (Fridays skipped)!`
    );
    setTimeout(() => setAppliedBanner(null), 4000);
  };

  const filteredDays = days.filter((d) => {
    const res = summary.dayResults[d.date];
    if (filter === 'overtime') return res && res.overtimeMinutes > 0;
    if (filter === 'incomplete') return res && res.isIncomplete;
    if (filter === 'weekly_off') return res && res.isWeeklyOff;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Master Bulk Check-In Control Box (Strict 24H, Auto-skips Friday, manual override below) */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/70 rounded-2xl p-4 sm:p-5 border border-blue-500/40 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-blue-500/20 text-sky-400 border border-blue-400/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                {t.masterCheckInTitle}
              </h3>
              <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700/60">
                24-Hour Format • 8h Duty + 1h Break
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {t.masterCheckInSubtitle}
            </p>
          </div>

          {/* Controls Box */}
          <div className="flex flex-wrap items-end gap-2.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            {/* Master Check-In Box */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-sky-400 mb-1">
                Master Check-In (24H)
              </label>
              <div className="flex items-center gap-1.5">
                <BufferedTimeInput
                  value={masterCheckIn}
                  onChange={setMasterCheckIn}
                  ariaLabel="Master Check-In Time for all workdays"
                />
                {/* Quick 24h Presets */}
                <div className="hidden sm:flex items-center gap-1">
                  {['05:30', '06:00', '08:00', '15:00'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMasterCheckIn(preset)}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition ${
                        masterCheckIn === preset
                          ? 'bg-blue-600 text-white border-blue-400'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Button 1: Apply Check-In Only to All (Skip Friday) */}
            <button
              type="button"
              onClick={handleMasterCheckInApply}
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-md shadow-blue-600/30 transition active:scale-95 flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t.applyCheckInAll}</span>
            </button>

            {/* Divider */}
            <div className="hidden sm:block h-8 w-px bg-slate-800 mx-1" />

            {/* Optional Master Check-Out + Apply Full Shift */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                Check-Out (24H)
              </label>
              <div className="flex items-center gap-1.5">
                <BufferedTimeInput
                  value={masterCheckOut}
                  onChange={setMasterCheckOut}
                  ariaLabel="Master Check-Out Time"
                />
                <div className="hidden sm:flex items-center gap-1">
                  {['17:00', '19:00', '20:00', '07:00'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMasterCheckOut(preset)}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition ${
                        masterCheckOut === preset
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleMasterFullShiftApply}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.applyShiftAll}</span>
            </button>

            {/* Scan Sheet Shortcut Button */}
            <button
              type="button"
              onClick={onOpenScanner}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 transition active:scale-95 flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.scanSheetBtn}</span>
            </button>
          </div>
        </div>

        {appliedBanner && (
          <div className="mt-3 flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-3 py-2 rounded-xl text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{appliedBanner}</span>
          </div>
        )}
      </div>

      {/* Main Daily Table Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap bg-slate-950/50">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>
                Daily Timesheet Log ({days[0]?.displayDate || '26'} –{' '}
                {days[days.length - 1]?.displayDate || '25'} • {days.length} Days)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Cycle: 26th to 25th • Fixed 8h Regular Duty + 1h Break (9h Shift) • Fridays auto-marked Weekly Off
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Days ({days.length})
            </button>
            <button
              onClick={() => setFilter('overtime')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                filter === 'overtime' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <Zap className="w-3 h-3" />
              Overtime Days
            </button>
            <button
              onClick={() => setFilter('incomplete')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                filter === 'incomplete' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-red-400'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              Incomplete ({summary.incompleteEntriesCount})
            </button>
            <button
              onClick={() => setFilter('weekly_off')}
              className={`px-3 py-1 rounded-lg transition ${
                filter === 'weekly_off' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-blue-400'
              }`}
            >
              Weekly Offs ({summary.weeklyOffDaysCount})
            </button>
          </div>
        </div>

        {/* Table Container - Mobile Responsive */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 sm:px-4">{t.date} &amp; {t.day}</th>
                <th className="py-3 px-2 sm:px-3">{t.status}</th>
                <th className="py-3 px-2 sm:px-3">{t.checkIn}</th>
                <th className="py-3 px-2 sm:px-3">{t.checkOut}</th>
                <th className="py-3 px-2 sm:px-3">{t.breakDuration}</th>
                <th className="py-3 px-2 sm:px-3 text-right">{t.netHours}</th>
                <th className="py-3 px-2 sm:px-3 text-right">{t.regularDuty}</th>
                <th className="py-3 px-2 sm:px-3 text-right">{t.overtime}</th>
                <th className="py-3 px-2 sm:px-3 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
              {filteredDays.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No days found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredDays.map((day, idx) => {
                  const res = summary.dayResults[day.date];
                  const netMins = res ? res.netMinutes : 0;
                  const regMins = res ? res.regularMinutes : 0;
                  const otMins = res ? res.overtimeMinutes : 0;
                  const isOvertime = otMins > 0;
                  const isWeeklyOff = res?.isWeeklyOff || weeklyOffDays.includes(day.dayOfWeek);
                  const isIncomplete = res?.isIncomplete;
                  const isOvernight = res?.isOvernight;
                  const isFriday = day.dayOfWeek === 5;

                  return (
                    <tr
                      key={day.date}
                      className={`hover:bg-slate-800/40 transition group ${
                        isIncomplete
                          ? 'bg-amber-950/20'
                          : isWeeklyOff
                          ? 'bg-blue-950/15'
                          : isOvertime
                          ? 'bg-amber-950/10'
                          : ''
                      }`}
                    >
                      {/* Date & Day (26th to 25th Cycle Badge) */}
                      <td className="py-2.5 px-3 sm:px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex flex-col items-center justify-center min-w-[44px] px-1.5 py-1 rounded-lg font-extrabold tabular-nums border leading-none ${
                              isFriday
                                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                                : isWeeklyOff
                                ? 'bg-blue-500/10 border-blue-500/30 text-sky-400'
                                : 'bg-slate-800 border-slate-700 text-white'
                            }`}
                          >
                            <span className="text-xs">{day.dayOfMonth.toString().padStart(2, '0')}</span>
                            {day.monthShort && (
                              <span className="text-[9px] uppercase tracking-wider opacity-80 mt-0.5">
                                {day.monthShort}
                              </span>
                            )}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-white">
                              <span>{day.dayName}</span>
                              {isFriday && (
                                <span className="text-[9px] bg-blue-950 text-sky-300 px-1.5 py-0.5 rounded border border-blue-800">
                                  Friday Off
                                </span>
                              )}
                              {isOvernight && (
                                <span
                                  className="inline-flex items-center gap-0.5 text-[9px] bg-indigo-950 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-800"
                                  title="Overnight Shift: Crosses midnight"
                                >
                                  <Moon className="w-2.5 h-2.5" /> Night
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 tabular-nums">{day.date}</span>
                          </div>
                        </div>
                      </td>

                      {/* Attendance Status */}
                      <td className="py-2.5 px-2 sm:px-3">
                        <select
                          value={day.status}
                          onChange={(e) =>
                            onUpdateDay(day.date, { status: e.target.value as AttendanceStatus })
                          }
                          className="bg-slate-950/90 text-[11px] font-semibold text-slate-200 border border-slate-700/80 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                          aria-label={`Status for ${day.date}`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id} className="bg-slate-900 text-white">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Glitch-Free Check In */}
                      <td className="py-2.5 px-2 sm:px-3">
                        <BufferedTimeInput
                          value={day.checkIn || ''}
                          onChange={(val) =>
                            onUpdateDay(day.date, {
                              checkIn: val,
                              breakMinutes: 60, // Always maintain 1h fixed break
                            })
                          }
                          isIncompleteWarning={Boolean(isIncomplete && !day.checkIn)}
                          ariaLabel={`Check-in for ${day.date}`}
                        />
                      </td>

                      {/* Glitch-Free Check Out */}
                      <td className="py-2.5 px-2 sm:px-3">
                        <BufferedTimeInput
                          value={day.checkOut || ''}
                          onChange={(val) =>
                            onUpdateDay(day.date, {
                              checkOut: val,
                              breakMinutes: 60, // Always maintain 1h fixed break
                            })
                          }
                          isIncompleteWarning={Boolean(isIncomplete && !day.checkOut)}
                          ariaLabel={`Check-out for ${day.date}`}
                        />
                      </td>

                      {/* Fixed 1h Break Badge */}
                      <td className="py-2.5 px-2 sm:px-3">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-bold text-sky-300"
                          title="Break is fixed at 1 hour (60 mins) per L&T 8h Duty + 1h Break policy"
                        >
                          <Lock className="w-3 h-3 text-sky-400" />
                          1h (Fixed)
                        </span>
                      </td>

                      {/* Net Hours */}
                      <td className="py-2.5 px-2 sm:px-3 text-right font-mono font-bold">
                        {isIncomplete ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/40"
                            title={t.incompleteWarning}
                          >
                            <AlertCircle className="w-3 h-3 text-amber-400" />
                            Incomplete
                          </span>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span
                              className={`tabular-nums ${
                                netMins > 0 ? 'text-white font-extrabold text-sm' : 'text-slate-500'
                              }`}
                            >
                              {(netMins / 60).toFixed(1)}h
                            </span>
                            {netMins > 0 && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                {formatDuration(netMins, 'hm')} (-1h brk)
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Regular Hours (8h max on normal days) */}
                      <td className="py-2.5 px-2 sm:px-3 text-right font-mono tabular-nums">
                        <span className={regMins > 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                          {(regMins / 60).toFixed(1)}h
                        </span>
                      </td>

                      {/* Overtime Hours */}
                      <td className="py-2.5 px-2 sm:px-3 text-right font-mono tabular-nums">
                        {otMins > 0 ? (
                          <span className="inline-flex items-center justify-end gap-1 font-extrabold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-600/30">
                            <Zap className="w-3 h-3 text-amber-400" />
                            +{(otMins / 60).toFixed(1)}h
                          </span>
                        ) : (
                          <span className="text-slate-600">0.0h</span>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="py-2.5 px-2 sm:px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Copy Yesterday's Shift */}
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => onCopyPreviousDay(idx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition"
                              title="Copy previous day's shift"
                              aria-label={`Copy previous day to ${day.date}`}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Open Detailed Edit Modal */}
                          <button
                            type="button"
                            onClick={() => onOpenEditModal(day)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Edit details & notes"
                            aria-label={`Edit ${day.date}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick clear day */}
                          {(day.checkIn || day.checkOut) && (
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateDay(day.date, {
                                  checkIn: '',
                                  checkOut: '',
                                  breakMinutes: 60,
                                  notes: '',
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                              title="Clear entry"
                              aria-label={`Clear entry for ${day.date}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
