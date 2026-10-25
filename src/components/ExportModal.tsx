/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Building2,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Share2,
  Upload,
  User,
  X,
  CheckCircle,
} from 'lucide-react';
import { DayEntry, Language, MonthSettings, MonthlySummary, UserProfile } from '../types/timesheet';
import { translations } from '../utils/translations';
import { formatCycleTitle } from '../utils/engine';
import {
  exportTimesheetToCSV,
  exportTimesheetToExcel,
  shareTimesheetSummary,
} from '../utils/export';
import { exportAllDataAsJSON, importAllDataFromJSON } from '../utils/storage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  days: DayEntry[];
  summary: MonthlySummary;
  settings: MonthSettings;
  profile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  language: Language;
  onDataRestored: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  days,
  summary,
  settings,
  profile,
  onUpdateProfile,
  language,
  onDataRestored,
}) => {
  if (!isOpen) return null;
  const t = translations[language];

  const [shareSuccess, setShareSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const cycleLabel = formatCycleTitle(
    settings.year,
    settings.month,
    settings.cycleMode || '26_to_25'
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExcelExport = () => {
    exportTimesheetToExcel(days, summary, settings, profile);
  };

  const handleCSVExport = () => {
    exportTimesheetToCSV(days, summary, settings, profile);
  };

  const handleShare = async () => {
    const ok = await shareTimesheetSummary(summary, settings, profile);
    if (ok) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    }
  };

  const handleBackupDownload = () => {
    const json = exportAllDataAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DutyMate_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importAllDataFromJSON(content);
        if (ok) {
          setImportStatus('Backup restored successfully!');
          onDataRestored();
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('Failed to parse backup JSON.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-sky-400 border border-blue-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {t.exportReport} ({cycleLabel})
              </h3>
              <p className="text-xs text-slate-400">
                Official reports for site supervisors, project managers, and payroll
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

        {/* Worker & Project Profile Info (requirement 9) */}
        <div className="mt-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {t.employeeProfile}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">{t.employeeName}</label>
              <input
                type="text"
                value={profile.employeeName}
                onChange={(e) => onUpdateProfile({ employeeName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Employee / Tech ID</label>
              <input
                type="text"
                value={profile.employeeId}
                onChange={(e) => onUpdateProfile({ employeeId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{t.companyName}</label>
              <input
                type="text"
                value={profile.companyName}
                onChange={(e) => onUpdateProfile({ companyName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{t.projectSite}</label>
              <input
                type="text"
                value={profile.projectName}
                onChange={(e) => onUpdateProfile({ projectName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Base Hourly Rate ({profile.currency})</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={profile.hourlyRate}
                onChange={(e) => onUpdateProfile({ hourlyRate: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{t.overtimeMultiplier}</label>
              <select
                value={profile.overtimeMultiplier}
                onChange={(e) =>
                  onUpdateProfile({ overtimeMultiplier: parseFloat(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              >
                <option value={1.25}>1.25x Base</option>
                <option value={1.5}>1.50x Base (Standard OT)</option>
                <option value={1.75}>1.75x Base</option>
                <option value={2.0}>2.00x Base (Double Time)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estimated Gross Payout Card */}
        <div className="mt-4 bg-gradient-to-r from-blue-950/60 to-emerald-950/40 p-4 rounded-xl border border-blue-600/30 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-400 block">
              {t.estimatedGrossPay}
            </span>
            <div className="text-2xl font-extrabold text-white mt-1 tabular-nums">
              {profile.currency}
              {summary.estimatedTotalPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Base: {profile.currency}{summary.estimatedBasePay.toFixed(2)} + OT: {profile.currency}
              {summary.estimatedOvertimePay.toFixed(2)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Export Buttons Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Excel Export */}
          <button
            onClick={handleExcelExport}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/50 text-emerald-300 transition group active:scale-95 text-center"
          >
            <FileSpreadsheet className="w-5 h-5 mb-1.5 group-hover:scale-110 transition text-emerald-400" />
            <span className="text-xs font-bold">Excel (.xlsx)</span>
            <span className="text-[10px] text-emerald-400/80">Full Formulas & Style</span>
          </button>

          {/* CSV Export */}
          <button
            onClick={handleCSVExport}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 transition group active:scale-95 text-center"
          >
            <FileText className="w-5 h-5 mb-1.5 group-hover:scale-110 transition text-sky-400" />
            <span className="text-xs font-bold">CSV Report</span>
            <span className="text-[10px] text-slate-400">Lightweight raw data</span>
          </button>

          {/* Print / Save PDF */}
          <button
            onClick={handlePrint}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-950/50 hover:bg-blue-900/60 border border-blue-500/50 text-sky-300 transition group active:scale-95 text-center"
          >
            <Printer className="w-5 h-5 mb-1.5 group-hover:scale-110 transition text-sky-400" />
            <span className="text-xs font-bold">{t.printReport}</span>
            <span className="text-[10px] text-sky-400/80">Printable sheet with signatures</span>
          </button>

          {/* Native Share */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-600/50 text-indigo-300 transition group active:scale-95 text-center"
          >
            <Share2 className="w-5 h-5 mb-1.5 group-hover:scale-110 transition text-indigo-400" />
            <span className="text-xs font-bold">{t.shareReport}</span>
            <span className="text-[10px] text-indigo-400/80">Native Android share</span>
          </button>
        </div>

        {shareSuccess && (
          <div className="mt-3 flex items-center gap-2 p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Timesheet summary shared or copied to clipboard!
          </div>
        )}

        {/* Data Backup & Restore Section (Requirement 10) */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider text-slate-300">
              {t.backupRestore}
            </span>
            <span>All records stay strictly on your local device</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleBackupDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              {t.exportJSON}
            </button>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.importJSON}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {importStatus && (
              <span className="text-xs font-semibold text-emerald-400">{importStatus}</span>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
