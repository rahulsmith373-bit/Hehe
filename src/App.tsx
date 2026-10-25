/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  AttendanceStatus,
  DayEntry,
  Language,
  MonthSettings,
  ThemeMode,
  TimeFormat,
  UserProfile,
} from './types/timesheet';
import {
  calculateMonthlyTimesheet,
  generateMonthDays,
} from './utils/engine';
import {
  getStoredDays,
  getStoredProfile,
  getStoredSettings,
  saveDays,
  saveProfile,
  saveSettings,
} from './utils/storage';
import { Header } from './components/Header';
import { SummaryStats } from './components/SummaryStats';
import { WeeklyOffPanel } from './components/WeeklyOffPanel';
import { ChartsSection } from './components/ChartsSection';
import { DailyTable } from './components/DailyTable';
import { SettingsPanel } from './components/SettingsPanel';
import { QuickEntryModal } from './components/QuickEntryModal';
import { ExportModal } from './components/ExportModal';
import { ScanSheetModal, ScannedEntry, ScanMetadata } from './components/ScanSheetModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PrintableTimesheet } from './components/PrintableTimesheet';
import { Undo2, RotateCcw } from 'lucide-react';
import { translations } from './utils/translations';

export default function App() {
  // Application State
  const [settings, setSettings] = useState<MonthSettings>(() => getStoredSettings());
  const [profile, setProfile] = useState<UserProfile>(() => getStoredProfile());
  const [language, setLanguage] = useState<Language>('en');
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('24h');
  const [theme, setTheme] = useState<ThemeMode>('dark');

  // Days state for the active month/cycle (26th to 25th by default)
  const [days, setDays] = useState<DayEntry[]>(() =>
    getStoredDays(
      settings.year,
      settings.month,
      settings.weeklyOffDays,
      settings.cycleMode || '26_to_25'
    )
  );

  // Undo history buffer
  const [history, setHistory] = useState<DayEntry[][]>([]);

  // Modal controls
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBatchFillOpen, setIsBatchFillOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<DayEntry | null>(null);

  // Reload days whenever year, month, or cycleMode changes
  useEffect(() => {
    const loaded = getStoredDays(
      settings.year,
      settings.month,
      settings.weeklyOffDays,
      settings.cycleMode || '26_to_25'
    );
    setDays(loaded);
    setHistory([]);
  }, [settings.year, settings.month, settings.cycleMode]);

  // Save settings whenever they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Save profile whenever it changes
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  // Save days whenever days change
  useEffect(() => {
    saveDays(settings.year, settings.month, days, settings.cycleMode || '26_to_25');
  }, [days, settings.year, settings.month, settings.cycleMode]);

  // Compute monthly calculations dynamically using the single non-double-counting engine
  const summary = useMemo(() => {
    return calculateMonthlyTimesheet(days, settings);
  }, [days, settings]);

  // Push to history buffer before a bulk or significant edit
  const pushHistory = (currentDays: DayEntry[]) => {
    setHistory((prev) => [JSON.parse(JSON.stringify(currentDays)), ...prev.slice(0, 9)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const [previousState, ...rest] = history;
    setDays(previousState);
    setHistory(rest);
  };

  // Single Day updates ( always enforces 60m fixed break )
  const handleUpdateDay = (date: string, updates: Partial<DayEntry>) => {
    setDays((prev) =>
      prev.map((d) =>
        d.date === date
          ? {
              ...d,
              ...updates,
              breakMinutes: 60, // Fixed 1h break
            }
          : d
      )
    );
  };

  // Master Check-In Control — Applies Check-In (and optional Check-Out) to all non-Friday working days
  const handleApplyCheckInToAll = (checkInTime: string, checkOutTime?: string) => {
    pushHistory(days);

    setDays((prev) =>
      prev.map((day) => {
        const isWeeklyOff = settings.weeklyOffDays.includes(day.dayOfWeek);
        if (isWeeklyOff) {
          // Automatically skip Friday / weekly off days
          return {
            ...day,
            status: 'weekly_off',
          };
        }

        return {
          ...day,
          checkIn: checkInTime,
          checkOut: checkOutTime !== undefined ? checkOutTime : day.checkOut,
          breakMinutes: 60, // Fixed 1h break
          status: 'present',
        };
      })
    );
  };

  // Apply Scanned Timesheet Entries (AI OCR / Excel / Text) with top-to-bottom 26-to-25 row support
  const handleApplyScannedEntries = (scanned: ScannedEntry[], meta?: ScanMetadata) => {
    pushHistory(days);

    if (meta) {
      setProfile((prev) => ({
        ...prev,
        employeeName: meta.employeeName || prev.employeeName,
        employeeId: meta.employeeId || prev.employeeId,
        projectName: meta.projectName || prev.projectName,
      }));
    }

    const mapByDay = new Map<number, ScannedEntry>();
    scanned.forEach((s) => {
      if (s.dayOfMonth >= 1 && s.dayOfMonth <= 31) {
        mapByDay.set(s.dayOfMonth, s);
      }
    });

    setDays((prev) =>
      prev.map((day, idx) => {
        // Match by exact dayOfMonth (26..31, 1..25) or fallback to sequential row index (top-to-bottom)
        const match = mapByDay.get(day.dayOfMonth) || scanned[idx];
        if (!match) return day;

        const isFriday = day.dayOfWeek === 5;
        return {
          ...day,
          checkIn: match.checkIn,
          checkOut: match.checkOut,
          breakMinutes: 60, // Fixed 1h break
          status: isFriday ? 'weekly_off' : match.status,
          notes: match.notes || day.notes,
        };
      })
    );
  };

  // Copy previous day's shift
  const handleCopyPreviousDay = (currentIndex: number) => {
    if (currentIndex <= 0) return;
    const prevDay = days[currentIndex - 1];
    const targetDay = days[currentIndex];

    pushHistory(days);
    handleUpdateDay(targetDay.date, {
      checkIn: prevDay.checkIn,
      checkOut: prevDay.checkOut,
      breakMinutes: 60,
      status: prevDay.status === 'weekly_off' ? 'present' : prevDay.status,
      notes: prevDay.notes,
    });
  };

  // Apply batch shift
  const handleApplyBatchShift = (params: {
    checkIn: string;
    checkOut: string;
    breakMinutes: number;
    status: AttendanceStatus;
    notes?: string;
    target: 'all' | 'workdays_only' | 'range';
    startDate?: string;
    endDate?: string;
  }) => {
    pushHistory(days);

    setDays((prev) =>
      prev.map((day) => {
        const isWeeklyOff = settings.weeklyOffDays.includes(day.dayOfWeek);

        if (params.target === 'workdays_only' && isWeeklyOff) {
          return day; // Skip weekly off days
        }

        if (params.target === 'range') {
          if (params.startDate && day.date < params.startDate) return day;
          if (params.endDate && day.date > params.endDate) return day;
        }

        return {
          ...day,
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          breakMinutes: 60, // Fixed 1h break
          status: params.status,
          notes: params.notes || day.notes,
        };
      })
    );
  };

  // Clear month shifts
  const handleClearMonth = () => {
    pushHistory(days);
    const reset = generateMonthDays(
      settings.year,
      settings.month,
      settings.weeklyOffDays,
      settings.cycleMode || '26_to_25'
    );
    setDays(reset);
  };

  const t = translations[language];

  return (
    <div
      dir={language === 'ur' ? 'rtl' : 'ltr'}
      className={`min-h-screen ${
        theme === 'dark'
          ? 'bg-slate-950 text-slate-100'
          : 'bg-slate-50 text-slate-900'
      } flex flex-col font-sans transition-colors selection:bg-blue-600 selection:text-white pb-12`}
    >
      {/* Header with Month Selector, Scan Sheet button, PWA Install, Format Toggles */}
      <Header
        settings={settings}
        onUpdateSettings={(updates) => setSettings((s) => ({ ...s, ...updates }))}
        language={language}
        onToggleLanguage={() => setLanguage((l) => (l === 'en' ? 'ur' : 'en'))}
        timeFormat={timeFormat}
        onToggleTimeFormat={() => setTimeFormat((f) => (f === '12h' ? '24h' : '12h'))}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBatchFill={() => {
          setEditingDay(null);
          setIsBatchFillOpen(true);
        }}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 space-y-5 flex-1">
        {/* Undo banner & quick batch controls */}
        {history.length > 0 && (
          <div className="flex items-center justify-between bg-blue-950/60 border border-blue-600/40 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-200">
            <span className="flex items-center gap-1.5">
              <Undo2 className="w-3.5 h-3.5 text-sky-400" />
              Bulk edit applied. You can undo this action anytime.
            </span>
            <button
              onClick={handleUndo}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold transition"
            >
              Undo Last Action
            </button>
          </div>
        )}

        {/* Primary Dashboard Summary Cards & Regular vs Overtime Progress */}
        <SummaryStats summary={summary} language={language} />

        {/* Dedicated Smart Weekly Off / Friday Engine Panel */}
        <WeeklyOffPanel
          summary={summary}
          settings={settings}
          onUpdateSettings={(updates) => setSettings((s) => ({ ...s, ...updates }))}
          language={language}
        />

        {/* Visual Charts & Attendance Calendar Section */}
        <ChartsSection days={days} summary={summary} language={language} />

        {/* Master Check-In Control Bar + Daily Timesheet Table with Glitch-Free Inputs */}
        <DailyTable
          days={days}
          summary={summary}
          language={language}
          timeFormat={timeFormat}
          weeklyOffDays={settings.weeklyOffDays}
          onUpdateDay={handleUpdateDay}
          onApplyCheckInToAll={handleApplyCheckInToAll}
          onCopyPreviousDay={handleCopyPreviousDay}
          onOpenEditModal={(day) => {
            setEditingDay(day);
            setIsBatchFillOpen(true);
          }}
          onOpenScanner={() => setIsScannerOpen(true)}
        />

        {/* Bottom Utility Bar: Clear Month, Backup & Export */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
          <button
            onClick={handleClearMonth}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-red-950/50 text-slate-400 hover:text-red-400 border border-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.clearMonth}</span>
          </button>

          <div className="text-xs text-slate-500 text-center sm:text-right">
            L&amp;T Time Calculator v2.0 • Fixed 8h Duty + 1h Break (9h Shift) • Zero Double-Counting
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(updates) => setSettings((s) => ({ ...s, ...updates }))}
        language={language}
        onResetMonth={handleClearMonth}
      />

      {/* Quick Entry / Batch Fill Modal */}
      <QuickEntryModal
        isOpen={isBatchFillOpen}
        onClose={() => {
          setIsBatchFillOpen(false);
          setEditingDay(null);
        }}
        days={days}
        settings={settings}
        language={language}
        onApplyBatchShift={handleApplyBatchShift}
        editingDay={editingDay}
        onSaveSingleDay={handleUpdateDay}
      />

      {/* Smart Sheet Scanner & Auto-Fill Modal */}
      <ScanSheetModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        days={days}
        settings={settings}
        language={language}
        onApplyScannedEntries={handleApplyScannedEntries}
      />

      {/* Export & Payout Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        days={days}
        summary={summary}
        settings={settings}
        profile={profile}
        onUpdateProfile={(updates) => setProfile((p) => ({ ...p, ...updates }))}
        language={language}
        onDataRestored={() => {
          const loaded = getStoredDays(
            settings.year,
            settings.month,
            settings.weeklyOffDays,
            settings.cycleMode || '26_to_25'
          );
          setDays(loaded);
        }}
      />

      {/* Offline Status Pill */}
      <OfflineIndicator />

      {/* Printable Timesheet Document (Only visible during print / save to PDF) */}
      <PrintableTimesheet
        days={days}
        summary={summary}
        settings={settings}
        profile={profile}
      />
    </div>
  );
}
