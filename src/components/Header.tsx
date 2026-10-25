/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Globe,
  Moon,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';
import { Language, MonthSettings, ThemeMode, TimeFormat } from '../types/timesheet';
import { translations } from '../utils/translations';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  settings: MonthSettings;
  onUpdateSettings: (updates: Partial<MonthSettings>) => void;
  language: Language;
  onToggleLanguage: () => void;
  timeFormat: TimeFormat;
  onToggleTimeFormat: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenBatchFill: () => void;
  onOpenExport: () => void;
  onOpenScanner: () => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  language,
  onToggleLanguage,
  timeFormat,
  onToggleTimeFormat,
  theme,
  onToggleTheme,
  onOpenSettings,
  onOpenBatchFill,
  onOpenExport,
  onOpenScanner,
}) => {
  const t = translations[language];

  const handlePrevMonth = () => {
    if (settings.month === 1) {
      onUpdateSettings({ year: settings.year - 1, month: 12 });
    } else {
      onUpdateSettings({ month: settings.month - 1 });
    }
  };

  const handleNextMonth = () => {
    if (settings.month === 12) {
      onUpdateSettings({ year: settings.year + 1, month: 1 });
    } else {
      onUpdateSettings({ month: settings.month + 1 });
    }
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/90 border-b border-slate-800/80 transition-colors shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
        {/* Top bar: Brand & Top Utilities */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-600 via-sky-500 to-indigo-700 shadow-md shadow-blue-500/20 ring-1 ring-blue-400/30">
              <Clock className="w-5 h-5 text-white" />
              <span className="absolute -bottom-1 -right-1 flex h-4 px-1 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-slate-950">
                L&amp;T
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-sky-100 to-blue-400 bg-clip-text text-transparent">
                  {t.appName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/90 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-inset ring-emerald-600/50">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {t.fixedDutyBadge}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Controls: Time Format, Language, Theme, PWA */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <PWAInstallButton />

            {/* 12h / 24h Toggle */}
            <button
              onClick={onToggleTimeFormat}
              aria-label="Toggle 12/24 hour time format"
              className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-sm transition"
              title="Toggle 12h or 24h time display"
            >
              <Clock className="w-3.5 h-3.5 mr-1 text-sky-400" />
              {timeFormat.toUpperCase()}
            </button>

            {/* Language toggle */}
            <button
              onClick={onToggleLanguage}
              aria-label="Toggle Language"
              className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-sm transition"
              title="Switch between English and Urdu"
            >
              <Globe className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              <span>{language === 'en' ? 'UR (اردو)' : 'EN (English)'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              aria-label="Toggle Dark/Light Mode"
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/60 transition"
              title="Toggle Dark / Light Mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-sky-300" />
              )}
            </button>
          </div>
        </div>

        {/* Bottom bar: Month Selector & Action Buttons */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between gap-3 flex-wrap">
          {/* Month & Year Navigator + 26-to-25 Cycle Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous Cycle"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                title="Previous Cycle"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                <Calendar className="w-4 h-4 text-sky-400" />
                {/* Cycle / Month selector */}
                <select
                  value={settings.month}
                  onChange={(e) => onUpdateSettings({ month: parseInt(e.target.value, 10) })}
                  className="bg-transparent text-sm font-bold text-white border-none focus:outline-none focus:ring-1 focus:ring-sky-500 rounded py-0.5 cursor-pointer"
                  aria-label="Select cycle month"
                >
                  {MONTH_NAMES.map((name, idx) => {
                    const mShort = name.slice(0, 3);
                    const nextShort = MONTH_NAMES[(idx + 1) % 12].slice(0, 3);
                    const is26Cycle = (settings.cycleMode || '26_to_25') === '26_to_25';
                    return (
                      <option key={name} value={idx + 1} className="bg-slate-900 text-white">
                        {is26Cycle ? `26 ${mShort} – 25 ${nextShort}` : name}
                      </option>
                    );
                  })}
                </select>

                {/* Year selector */}
                <select
                  value={settings.year}
                  onChange={(e) => onUpdateSettings({ year: parseInt(e.target.value, 10) })}
                  className="bg-transparent text-sm font-bold text-sky-400 border-none focus:outline-none focus:ring-1 focus:ring-sky-500 rounded py-0.5 cursor-pointer"
                  aria-label="Select year"
                >
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
                    <option key={yr} value={yr} className="bg-slate-900 text-white">
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleNextMonth}
                aria-label="Next Cycle"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
                title="Next Cycle"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Toggle Pill: 26th–25th Cycle vs 1st–End */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => onUpdateSettings({ cycleMode: '26_to_25' })}
                className={`px-2.5 py-1 rounded-lg transition ${
                  (settings.cycleMode || '26_to_25') === '26_to_25'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                26th – 25th Cycle
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ cycleMode: '1_to_end' })}
                className={`px-2.5 py-1 rounded-lg transition ${
                  settings.cycleMode === '1_to_end'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1st – End
              </button>
            </div>
          </div>

          {/* Quick Actions Group */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Scan Sheet to Auto-Fill Button */}
            <button
              onClick={onOpenScanner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition active:scale-95"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-100" />
              <span>{t.scanSheetBtn}</span>
            </button>

            <button
              onClick={onOpenBatchFill}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-700 to-sky-600 hover:from-blue-600 hover:to-sky-500 text-white shadow-md shadow-blue-600/20 transition active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-200" />
              <span>{t.batchFill}</span>
            </button>

            <button
              onClick={onOpenExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-sm transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>{t.exportReport}</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-sm transition active:scale-95"
              aria-label="Open settings"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.settings}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
