/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sliders,
  X,
  ShieldAlert,
} from 'lucide-react';
import { Language, MonthSettings, WeeklyOffMode, CalculationMethod } from '../types/timesheet';
import { translations } from '../utils/translations';
import { DEFAULT_SETTINGS } from '../utils/storage';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MonthSettings;
  onUpdateSettings: (updates: Partial<MonthSettings>) => void;
  language: Language;
  onResetMonth: () => void;
}

const WEEKDAYS = [
  { id: 0, label: 'Sun', full: 'Sunday' },
  { id: 1, label: 'Mon', full: 'Monday' },
  { id: 2, label: 'Tue', full: 'Tuesday' },
  { id: 3, label: 'Wed', full: 'Wednesday' },
  { id: 4, label: 'Thu', full: 'Thursday' },
  { id: 5, label: 'Fri', full: 'Friday' },
  { id: 6, label: 'Sat', full: 'Saturday' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  language,
  onResetMonth,
}) => {
  if (!isOpen) return null;
  const t = translations[language];

  const toggleWeeklyOffDay = (dayId: number) => {
    let updated: number[];
    if (settings.weeklyOffDays.includes(dayId)) {
      if (settings.weeklyOffDays.length === 1) return; // keep at least 1
      updated = settings.weeklyOffDays.filter((d) => d !== dayId);
    } else {
      updated = [...settings.weeklyOffDays, dayId].sort();
    }
    onUpdateSettings({ weeklyOffDays: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-sky-400 border border-blue-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t.settings}</h2>
              <p className="text-xs text-slate-400">
                Configure shift hours, weekly off logic, and overtime allocation rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-5 space-y-6">
          {/* Section 1: Daily Duty Limit (Fixed 8h Duty + 1h Break = 9h Shift) */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <label className="flex items-center justify-between text-sm font-semibold text-slate-200">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                {t.dailyDutyHours}
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                {settings.dailyDutyMinutes / 60}h Duty + 1h Break = {settings.dailyDutyMinutes / 60 + 1}h Shift
              </span>
            </label>
            <p className="text-xs text-slate-400 mt-1">
              L&amp;T Standard Policy: Fixed 8 hours net duty + 1 hour break (9 hours total regular shift).
            </p>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="range"
                min="4"
                max="16"
                step="0.5"
                value={settings.dailyDutyMinutes / 60}
                onChange={(e) =>
                  onUpdateSettings({ dailyDutyMinutes: Math.round(parseFloat(e.target.value) * 60) })
                }
                className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex items-center gap-1.5">
                {[8, 9, 10, 12].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onUpdateSettings({ dailyDutyMinutes: preset * 60 })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      settings.dailyDutyMinutes === preset * 60
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {preset}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Weekly Off Day Selector */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <label className="flex items-center justify-between text-sm font-semibold text-slate-200">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                {t.weeklyOffDay}
              </span>
              <span className="text-xs text-slate-400">Default: Friday</span>
            </label>
            <p className="text-xs text-slate-400 mt-1">
              Select one or more weekly off days (e.g. Friday, or Friday + Saturday).
            </p>
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((w) => {
                const isSelected = settings.weeklyOffDays.includes(w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => toggleWeeklyOffDay(w.id)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center border ${
                      isSelected
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>{w.label}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 mt-1 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Weekly Off Calculation Mode */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="text-sm font-semibold text-slate-200">
              {t.weeklyOffMode}
            </div>

            {/* Option 1: Excluded */}
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                settings.weeklyOffMode === 'excluded_from_regular'
                  ? 'bg-blue-950/40 border-blue-500 text-slate-100 ring-1 ring-blue-500/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <input
                type="radio"
                name="weeklyOffMode"
                value="excluded_from_regular"
                checked={settings.weeklyOffMode === 'excluded_from_regular'}
                onChange={() =>
                  onUpdateSettings({ weeklyOffMode: 'excluded_from_regular' as WeeklyOffMode })
                }
                className="mt-1 accent-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-100 block">{t.offDayExcluded}</span>
                <span className="text-slate-400 block mt-0.5">{t.offDayExcludedDesc}</span>
              </div>
            </label>

            {/* Option 2: Included */}
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                settings.weeklyOffMode === 'included_in_regular'
                  ? 'bg-blue-950/40 border-blue-500 text-slate-100 ring-1 ring-blue-500/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <input
                type="radio"
                name="weeklyOffMode"
                value="included_in_regular"
                checked={settings.weeklyOffMode === 'included_in_regular'}
                onChange={() =>
                  onUpdateSettings({ weeklyOffMode: 'included_in_regular' as WeeklyOffMode })
                }
                className="mt-1 accent-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-100 block">{t.offDayIncluded}</span>
                <span className="text-slate-400 block mt-0.5">{t.offDayIncludedDesc}</span>
              </div>
            </label>
          </div>

          {/* Section 4: Calculation Method */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="text-sm font-semibold text-slate-200">
              {t.calculationMethod}
            </div>

            {/* Method A */}
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                settings.calculationMethod === 'monthly_cap'
                  ? 'bg-blue-950/40 border-blue-500 text-slate-100 ring-1 ring-blue-500/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <input
                type="radio"
                name="calculationMethod"
                value="monthly_cap"
                checked={settings.calculationMethod === 'monthly_cap'}
                onChange={() =>
                  onUpdateSettings({ calculationMethod: 'monthly_cap' as CalculationMethod })
                }
                className="mt-1 accent-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-100 block">{t.methodMonthlyCap}</span>
                <span className="text-slate-400 block mt-0.5">{t.methodMonthlyCapDesc}</span>
              </div>
            </label>

            {/* Method B */}
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                settings.calculationMethod === 'daily_overtime'
                  ? 'bg-blue-950/40 border-blue-500 text-slate-100 ring-1 ring-blue-500/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <input
                type="radio"
                name="calculationMethod"
                value="daily_overtime"
                checked={settings.calculationMethod === 'daily_overtime'}
                onChange={() =>
                  onUpdateSettings({ calculationMethod: 'daily_overtime' as CalculationMethod })
                }
                className="mt-1 accent-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-100 block">{t.methodDailyOT}</span>
                <span className="text-slate-400 block mt-0.5">{t.methodDailyOTDesc}</span>
              </div>
            </label>
          </div>

          {/* Section 5: Manual Scheduled Hours Override */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200">
                {t.manualOverride}
              </label>
              <input
                type="checkbox"
                checked={settings.manualScheduledHoursOverride !== null}
                onChange={(e) =>
                  onUpdateSettings({
                    manualScheduledHoursOverride: e.target.checked ? 260 : null,
                  })
                }
                className="accent-blue-500 w-4 h-4 cursor-pointer"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Override automatically calculated scheduled regular hours (e.g., fixed contractual 260h).
            </p>

            {settings.manualScheduledHoursOverride !== null && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="400"
                  value={settings.manualScheduledHoursOverride}
                  onChange={(e) =>
                    onUpdateSettings({
                      manualScheduledHoursOverride: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono w-32 focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-300 font-semibold">{t.hours}</span>
              </div>
            )}
          </div>

          {/* Labor Policy Warning Banner */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs leading-relaxed">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Labor Regulation Compliance Notice</span>
              {t.laborPolicyWarning}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => onUpdateSettings(DEFAULT_SETTINGS)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetDefaults}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition active:scale-95"
          >
            {t.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
};
