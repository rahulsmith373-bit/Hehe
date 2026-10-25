/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Moon,
  Sparkles,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { AttendanceStatus, DayEntry, Language, MonthSettings } from '../types/timesheet';
import { translations } from '../utils/translations';
import { calculateDayShift } from '../utils/engine';
import { BufferedTimeInput } from './DailyTable';

interface QuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  days: DayEntry[];
  settings: MonthSettings;
  language: Language;
  onApplyBatchShift: (params: {
    checkIn: string;
    checkOut: string;
    breakMinutes: number;
    status: AttendanceStatus;
    notes?: string;
    target: 'all' | 'workdays_only' | 'range';
    startDate?: string;
    endDate?: string;
  }) => void;
  editingDay?: DayEntry | null;
  onSaveSingleDay?: (date: string, updates: Partial<DayEntry>) => void;
}

export const QuickEntryModal: React.FC<QuickEntryModalProps> = ({
  isOpen,
  onClose,
  days,
  settings,
  language,
  onApplyBatchShift,
  editingDay,
  onSaveSingleDay,
}) => {
  if (!isOpen) return null;
  const t = translations[language];

  const isSingleDayMode = !!editingDay;

  // Form State: 24-hour format (e.g. 05:30 to 20:00)
  const [checkIn, setCheckIn] = useState<string>(editingDay ? editingDay.checkIn : '05:30');
  const [checkOut, setCheckOut] = useState<string>(editingDay ? editingDay.checkOut : '20:00');
  const [breakMinutes] = useState<number>(60); // Fixed 1h break
  const [status, setStatus] = useState<AttendanceStatus>(
    editingDay ? editingDay.status : 'present'
  );
  const [notes, setNotes] = useState<string>(editingDay ? editingDay.notes || '' : '');
  const [targetScope, setTargetScope] = useState<'workdays_only' | 'all' | 'range'>(
    'workdays_only'
  );
  const [startRange, setStartRange] = useState<string>(days[0]?.date || '');
  const [endRange, setEndRange] = useState<string>(days[days.length - 1]?.date || '');

  // Live calculation preview
  const previewShift = calculateDayShift(checkIn, checkOut, breakMinutes);
  const dailyDuty = settings.dailyDutyMinutes;

  let previewRegular = 0;
  let previewOvertime = 0;

  if (previewShift.netMinutes > 0) {
    if (status === 'weekly_off' && settings.weeklyOffMode === 'excluded_from_regular') {
      previewRegular = 0;
      previewOvertime = previewShift.netMinutes;
    } else {
      previewRegular = Math.min(previewShift.netMinutes, dailyDuty);
      previewOvertime = Math.max(0, previewShift.netMinutes - previewRegular);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSingleDayMode && editingDay && onSaveSingleDay) {
      onSaveSingleDay(editingDay.date, {
        checkIn,
        checkOut,
        breakMinutes,
        status,
        notes,
      });
      onClose();
      return;
    }

    onApplyBatchShift({
      checkIn,
      checkOut,
      breakMinutes,
      status,
      notes,
      target: targetScope,
      startDate: startRange,
      endDate: endRange,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-sky-400 border border-blue-500/30">
              {isSingleDayMode ? <Clock className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isSingleDayMode
                  ? `${t.editDay}: ${editingDay?.dayName} (${editingDay?.date})`
                  : t.batchFill}
              </h3>
              <p className="text-xs text-slate-400">
                {isSingleDayMode
                  ? 'Update 24-hour check-in/out times and shift notes'
                  : 'Instantly populate multiple calendar days with your 24-hour shift'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Target Scope (Only in Batch Mode) */}
          {!isSingleDayMode && (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Target Days to Populate
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetScope('workdays_only')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border transition ${
                    targetScope === 'workdays_only'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Workdays Only
                </button>
                <button
                  type="button"
                  onClick={() => setTargetScope('all')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border transition ${
                    targetScope === 'all'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  All Days
                </button>
                <button
                  type="button"
                  onClick={() => setTargetScope('range')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border transition ${
                    targetScope === 'range'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Custom Range
                </button>
              </div>

              {targetScope === 'range' && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <label className="text-[11px] text-slate-400">From Date</label>
                    <input
                      type="date"
                      value={startRange}
                      onChange={(e) => setStartRange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">To Date</label>
                    <input
                      type="date"
                      value={endRange}
                      onChange={(e) => setEndRange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Time & Break Inputs (Strict 24H) */}
          <div className="grid grid-cols-3 gap-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.checkIn} (24H)
              </label>
              <BufferedTimeInput
                value={checkIn}
                onChange={setCheckIn}
                ariaLabel="Check-In 24H"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.checkOut} (24H)
              </label>
              <BufferedTimeInput
                value={checkOut}
                onChange={setCheckOut}
                ariaLabel="Check-Out 24H"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.breakDuration}
              </label>
              <div className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-sky-400 flex items-center justify-between">
                <span>1h (60m Fixed)</span>
              </div>
            </div>
          </div>

          {/* Status & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.status}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="present">Present (حاضر)</option>
                <option value="weekly_off">Weekly Off (ہفتہ وار چھٹی)</option>
                <option value="public_holiday">Public Holiday (سرکاری چھٹی)</option>
                <option value="sick_leave">Sick Leave (بیماری کی رخصت)</option>
                <option value="annual_leave">Annual Leave (سالانہ چھٹی)</option>
                <option value="half_day">Half Day (نصف دن)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.notes} (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Compressor overhaul, Site inspection"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Live Calculated Shift Preview Result (Requirement 8) */}
          <div className="bg-gradient-to-br from-blue-950/40 via-slate-950 to-slate-900 p-4 rounded-xl border border-blue-500/30">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-sky-400 mb-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live Calculated Result
              </span>
              {previewShift.isOvernight && (
                <span className="flex items-center gap-1 bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded text-[10px] border border-indigo-700">
                  <Moon className="w-3 h-3" /> Overnight Shift
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block">{t.netHours}</span>
                <span className="text-base font-extrabold text-white tabular-nums">
                  {(previewShift.netMinutes / 60).toFixed(1)}h
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block">{t.regularDuty}</span>
                <span className="text-base font-extrabold text-emerald-400 tabular-nums">
                  {(previewRegular / 60).toFixed(1)}h
                </span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block">{t.overtime}</span>
                <span className="text-base font-extrabold text-amber-400 tabular-nums">
                  {(previewOvertime / 60).toFixed(1)}h
                </span>
              </div>
            </div>
          </div>

          {/* Form Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition active:scale-95"
            >
              {isSingleDayMode ? t.saveChanges : t.apply}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
