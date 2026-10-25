/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { AttendanceStatus, DayEntry, Language, MonthSettings } from '../types/timesheet';
import { translations } from '../utils/translations';
import { ASAD_ALI_OCT26_ROWS } from '../utils/storage';

export interface ScannedEntry {
  rowNumber?: number;
  dayOfMonth: number;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface ScanMetadata {
  employeeName?: string;
  employeeId?: string;
  projectName?: string;
  startMonth?: number;
  startYear?: number;
}

interface ScanSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  days: DayEntry[];
  settings: MonthSettings;
  language: Language;
  onApplyScannedEntries: (entries: ScannedEntry[], meta?: ScanMetadata) => void;
}

/**
 * Strict 24-hour time normalizer ("5:30" -> "05:30", "20:00" -> "20:00", "7:00" -> "07:00").
 * Never converts 7:00 to 19:00 so night shifts (15:00 to 07:00) remain 100% accurate.
 */
function normalizeTimeStr24h(raw: unknown): string {
  if (!raw) return '';
  const str = String(raw).trim();
  if (!str || str === '--' || str === '-' || str.toLowerCase() === 'off') return '';

  const match = str.match(/^(\d{1,2})[:.\s]+(\d{1,2})\s*(AM|PM|am|pm)?$/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const mer = match[3]?.toUpperCase();

    if (mer === 'PM' && h < 12) h += 12;
    else if (mer === 'AM' && h === 12) h = 0;

    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
  }

  // Handle 3 or 4 digit raw numbers like 530 or 2000
  if (/^\d{3,4}$/.test(str)) {
    const padded = str.padStart(4, '0');
    const h = parseInt(padded.slice(0, 2), 10);
    const m = parseInt(padded.slice(2, 4), 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
  }

  return '';
}

/**
 * Downscales and compresses an image on the client using HTML5 Canvas
 * so OCR uploads and processes in ~1.5-2.5 seconds instead of 15+ seconds.
 */
async function compressImageForFastOCR(file: File): Promise<{
  base64Data: string;
  mimeType: string;
  previewUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onerror = () => {
        // Fallback to raw dataUrl if Image decode fails
        resolve({
          base64Data: dataUrl.split(',')[1],
          mimeType: file.type || 'image/jpeg',
          previewUrl: dataUrl,
        });
      };
      img.onload = () => {
        const MAX_DIM = 1150;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            base64Data: dataUrl.split(',')[1],
            mimeType: file.type || 'image/jpeg',
            previewUrl: dataUrl,
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve({
          base64Data: compressedUrl.split(',')[1],
          mimeType: 'image/jpeg',
          previewUrl: compressedUrl,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const ScanSheetModal: React.FC<ScanSheetModalProps> = ({
  isOpen,
  onClose,
  days,
  settings,
  language,
  onApplyScannedEntries,
}) => {
  if (!isOpen) return null;
  const t = translations[language];

  const [mode, setMode] = useState<'image' | 'excel' | 'text'>('image');
  const [isScanning, setIsScanning] = useState(false);
  const [autoApplyOnScan, setAutoApplyOnScan] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rawTextInput, setRawTextInput] = useState<string>('');
  const [scannedEntries, setScannedEntries] = useState<ScannedEntry[]>([]);
  const [scanMeta, setScanMeta] = useState<ScanMetadata>({});

  /**
   * Maps AI OCR rows top-to-bottom (26 to 25 sequence) even if some dates at the bottom are faded
   */
  const mapEntriesTopToBottom = (rawEntries: any[]): ScannedEntry[] => {
    // Standard 26-to-25 sequence for current cycle
    const expectedSequence = days.map((d) => d.dayOfMonth);

    return rawEntries.map((item: any, idx: number) => {
      // If date on left was faded or missing, count from top to bottom (row 0 = 26, ..., last row = 25)
      const seqDay =
        idx < expectedSequence.length ? expectedSequence[idx] : Number(item.dayOfMonth);
      const parsedDay = Number(item.dayOfMonth);
      const validDay =
        parsedDay >= 1 && parsedDay <= 31 ? parsedDay : seqDay || ((25 + idx) % 30) + 1;

      const checkIn = normalizeTimeStr24h(item.checkIn);
      const checkOut = normalizeTimeStr24h(item.checkOut);
      const rawStatus = String(item.status || '').toLowerCase();

      const status: AttendanceStatus =
        rawStatus === 'weekly_off' || rawStatus === 'f' ? 'weekly_off' : 'present';

      return {
        rowNumber: idx + 1,
        dayOfMonth: validDay,
        checkIn,
        checkOut,
        status,
        notes: `Row ${idx + 1} (Scanned 24h)`,
      };
    });
  };

  // 1. Fast Photo / Image Upload and Instant Auto-Fill via /api/scan-timesheet
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsScanning(true);

    try {
      // Step 1: Compress image on client (<50ms) so upload is super fast
      const { base64Data, mimeType, previewUrl } = await compressImageForFastOCR(file);
      setPreviewImage(previewUrl);

      const expectedDays = days.map((d) => d.dayOfMonth);
      const apiBase =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.protocol === 'capacitor:' ||
          window.location.protocol === 'file:') &&
        !window.location.port
          ? 'https://ais-pre-yt2jr3dqunpd75q2o6hje6-382725416346.europe-west2.run.app'
          : '';

      const response = await fetch(`${apiBase}/api/scan-timesheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType,
          year: settings.year,
          month: settings.month,
          expectedDays,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan sheet image');
      }

      if (Array.isArray(data.entries) && data.entries.length > 0) {
        const cleaned = mapEntriesTopToBottom(data.entries);
        const meta: ScanMetadata = {
          employeeName: data.employeeName,
          employeeId: data.employeeId,
          projectName: data.projectName,
          startMonth: data.startMonth,
          startYear: data.startYear,
        };
        setScannedEntries(cleaned);
        setScanMeta(meta);

        // Instant Auto-Fill if enabled ("foran scan kr ky fill kr dy")
        if (autoApplyOnScan) {
          onApplyScannedEntries(cleaned, meta);
          onClose();
          return;
        }
      } else {
        setErrorMsg('No attendance rows detected. Try a clearer photo.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error scanning image with AI OCR.');
    } finally {
      setIsScanning(false);
    }
  };

  // 2. Instant 1-Click Fill for Attached L&T Saudia Sheet (26 Sep – 25 Oct, Asad Ali)
  const handleInstantFillAttachedSheet = () => {
    const entries: ScannedEntry[] = ASAD_ALI_OCT26_ROWS.map((r, idx) => ({
      rowNumber: idx + 1,
      dayOfMonth: r.dayOfMonth,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      status: r.status,
      notes: r.notes,
    }));
    const meta: ScanMetadata = {
      employeeName: 'ASAD ALI',
      employeeId: 'SA24M013',
      projectName: 'SADAWI PV BSP',
      startMonth: 9,
      startYear: 2026,
    };
    onApplyScannedEntries(entries, meta);
    onClose();
  };

  // 3. Handle Excel (.xlsx) or CSV Upload directly in browser
  const handleSpreadsheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsScanning(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        const extracted: ScannedEntry[] = [];
        const expectedSeq = days.map((d) => d.dayOfMonth);
        let dataRowIdx = 0;

        for (const row of rows) {
          if (!Array.isArray(row) || row.length < 2) continue;

          const timeCells = row
            .map((c) => String(c ?? '').trim())
            .filter((c) => /^\d{1,2}[:.]\d{2}/.test(c));

          const cell0 = String(row[0] ?? '').trim();
          let dayNum: number | null = null;
          if (/^\d{1,2}$/.test(cell0)) {
            dayNum = parseInt(cell0, 10);
          } else if (/^(\d{1,2})[-/][A-Za-z0-9]+/.test(cell0)) {
            dayNum = parseInt(cell0.split(/[-/]/)[0], 10);
          } else if (timeCells.length > 0 && dataRowIdx < expectedSeq.length) {
            // Sequential top-to-bottom row fallback (26 to 25)
            dayNum = expectedSeq[dataRowIdx];
          }

          if (dayNum && dayNum >= 1 && dayNum <= 31) {
            const checkIn = timeCells[0] ? normalizeTimeStr24h(timeCells[0]) : '';
            const checkOut = timeCells[1] ? normalizeTimeStr24h(timeCells[1]) : '';
            const isFri =
              row.some((c) => String(c ?? '').trim().toUpperCase() === 'F') ||
              days.find((d) => d.dayOfMonth === dayNum)?.dayOfWeek === 5;

            extracted.push({
              rowNumber: dataRowIdx + 1,
              dayOfMonth: dayNum,
              checkIn,
              checkOut,
              status: isFri ? 'weekly_off' : 'present',
              notes: 'Imported from sheet (24h)',
            });
            dataRowIdx++;
          }
        }

        if (extracted.length > 0) {
          setScannedEntries(extracted);
          if (autoApplyOnScan) {
            onApplyScannedEntries(extracted);
            onClose();
            return;
          }
        } else {
          setErrorMsg('Could not find day rows (26–25) with Check-In/Out times.');
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to parse Excel/CSV file.');
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 4. Handle Pasted Text Scan (supports sequential top-to-bottom lines even without dates!)
  const handleTextScan = async () => {
    if (!rawTextInput.trim()) return;
    setErrorMsg(null);
    setIsScanning(true);

    try {
      const lines = rawTextInput
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const expectedSeq = days.map((d) => d.dayOfMonth);
      const localExtracted: ScannedEntry[] = [];

      lines.forEach((line, idx) => {
        const dayMatch = line.match(/^(\d{1,2})(?:[-/][A-Za-z]+)?\b/);
        const times = line.match(/\b(\d{1,2}[:.]\d{2})\b/g);
        const dNum = dayMatch
          ? parseInt(dayMatch[1], 10)
          : idx < expectedSeq.length
          ? expectedSeq[idx]
          : null;

        if (dNum && dNum >= 1 && dNum <= 31) {
          const cIn = times && times[0] ? normalizeTimeStr24h(times[0]) : '';
          const cOut = times && times[1] ? normalizeTimeStr24h(times[1]) : '';
          const isOff = /\b(off|friday|f)\b/i.test(line);
          localExtracted.push({
            rowNumber: idx + 1,
            dayOfMonth: dNum,
            checkIn: cIn,
            checkOut: cOut,
            status: isOff ? 'weekly_off' : 'present',
            notes: `Row ${idx + 1} (24h)`,
          });
        }
      });

      if (localExtracted.length > 0) {
        setScannedEntries(localExtracted);
        setIsScanning(false);
        if (autoApplyOnScan) {
          onApplyScannedEntries(localExtracted);
          onClose();
        }
        return;
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to scan text.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmApply = () => {
    if (scannedEntries.length === 0) return;
    onApplyScannedEntries(scannedEntries, scanMeta);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Fast 24H Sheet Scanner (26th to 25th Row Counter)
              </h3>
              <p className="text-xs text-slate-400">
                Counts rows top-to-bottom (26 → 25) even if dates are faded, and auto-fills in 24H format
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instant Auto-Fill Toggle & Quick Action for Uploaded L&T Sheet */}
        <div className="mt-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-200">
            <input
              type="checkbox"
              checked={autoApplyOnScan}
              onChange={(e) => setAutoApplyOnScan(e.target.checked)}
              className="rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Auto-fill timesheet immediately after scan (Fast Mode)</span>
          </label>

          <button
            type="button"
            onClick={handleInstantFillAttachedSheet}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Fill L&amp;T Sheet (26 Sep – 25 Oct • Asad Ali)</span>
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('image')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                mode === 'image' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Scan Photo / Image
            </button>
            <button
              type="button"
              onClick={() => setMode('excel')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                mode === 'excel' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel / CSV Sheet
            </button>
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                mode === 'text' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Paste Shift Log
            </button>
          </div>
        </div>

        {/* Upload / Input Area */}
        <div className="mt-4">
          {mode === 'image' && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 rounded-2xl p-6 bg-slate-950/60 cursor-pointer transition text-center">
              <Upload className="w-8 h-8 text-emerald-400 mb-2" />
              <span className="text-sm font-bold text-white">
                Tap to Upload or Take Photo of 26-to-25 Timesheet
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Fast client-compressed scan (~2 sec) • Automatically counts rows 26 → 25 if dates are faded • Strict 24H times
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>
          )}

          {mode === 'excel' && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500/70 rounded-2xl p-6 bg-slate-950/60 cursor-pointer transition text-center">
              <FileSpreadsheet className="w-8 h-8 text-sky-400 mb-2" />
              <span className="text-sm font-bold text-white">
                Select Excel (.xlsx) or CSV Attendance Sheet
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Automatically extracts 26-to-25 rows in 24H format with 1h Fixed Break
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleSpreadsheetUpload}
                className="hidden"
              />
            </label>
          )}

          {mode === 'text' && (
            <div className="space-y-2">
              <textarea
                rows={4}
                value={rawTextInput}
                onChange={(e) => setRawTextInput(e.target.value)}
                placeholder={'Paste daily log lines top-to-bottom (26 to 25), e.g.:\n26 05:30 20:00\n27 05:30 20:00\n11 15:00 07:00'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleTextScan}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition"
              >
                Extract &amp; Fill 24H Shifts
              </button>
            </div>
          )}
        </div>

        {/* Scanning Spinner */}
        {isScanning && (
          <div className="mt-4 flex items-center justify-center gap-2.5 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs font-bold text-emerald-200">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>
              Fast-scanning rows top-to-bottom (26 → 25) in 24-hour format...
            </span>
          </div>
        )}

        {/* Error Display */}
        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-950/50 border border-red-600/40 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scanned Results Preview Table (when auto-apply is unchecked) */}
        {scannedEntries.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Detected {scannedEntries.length} Rows (26 to 25 • 24H Format)
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-[10px] uppercase text-slate-400 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Row #</th>
                    <th className="py-2 px-3">Day (26–25)</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Check-In (24H)</th>
                    <th className="py-2 px-3">Check-Out (24H)</th>
                    <th className="py-2 px-3">Break</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {scannedEntries.map((entry, idx) => (
                    <tr key={`${entry.dayOfMonth}_${idx}`} className="hover:bg-slate-900/50">
                      <td className="py-1.5 px-3 text-slate-400 font-mono">#{idx + 1}</td>
                      <td className="py-1.5 px-3 font-bold text-white">Day {entry.dayOfMonth}</td>
                      <td className="py-1.5 px-3 text-slate-300">{entry.status}</td>
                      <td className="py-1.5 px-3 font-mono text-emerald-400">
                        {entry.checkIn || '--:--'}
                      </td>
                      <td className="py-1.5 px-3 font-mono text-sky-400">
                        {entry.checkOut || '--:--'}
                      </td>
                      <td className="py-1.5 px-3 text-slate-400">1h (Fixed)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {t.cancel}
          </button>
          {scannedEntries.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmApply}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 active:scale-95 transition"
            >
              Auto-Fill {scannedEntries.length} Days Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
