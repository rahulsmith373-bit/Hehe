/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  Package,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ASAD_ALI_OCT26_ROWS } from '../utils/storage';

const SHARED_APP_URL =
  'https://ais-pre-yt2jr3dqunpd75q2o6hje6-382725416346.europe-west2.run.app';

/**
 * Generates a 100% self-contained, single-file offline Android HTML app
 * that the user can save directly on their Android phone and open offline anytime.
 */
function downloadStandaloneMobileApp() {
  const initialRowsJson = JSON.stringify(ASAD_ALI_OCT26_ROWS);
  const htmlContent = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#0B132B" />
  <meta name="mobile-web-app-capable" content="yes" />
  <title>L&T Time Calculator (26–25 Offline Android Edition)</title>
  <style>
    * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
    body { margin: 0; background: #020617; color: #f1f5f9; padding: 12px; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 14px; padding: 14px; margin-bottom: 12px; }
    .header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .title { font-size: 18px; font-weight: 800; color: #38bdf8; margin: 0; }
    .badge { background: #064e3b; color: #6ee7b7; padding: 3px 8px; border-radius: 99px; font-size: 11px; font-weight: 700; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 8px; margin-top: 10px; }
    .stat { background: #020617; border: 1px solid #1e293b; border-radius: 10px; padding: 10px; }
    .stat-label { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; }
    .stat-val { font-size: 20px; font-weight: 800; margin-top: 4px; color: #fff; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 8px 6px; border-bottom: 1px solid #1e293b; text-align: left; }
    th { color: #94a3b8; font-size: 10px; text-transform: uppercase; background: #020617; }
    input.t24 { width: 72px; background: #020617; color: #fff; border: 1px solid #334155; border-radius: 6px; padding: 5px; text-align: center; font-family: monospace; font-weight: 700; }
    .btn { background: #0284c7; color: #fff; border: none; border-radius: 8px; padding: 8px 12px; font-size: 12px; font-weight: 700; cursor: pointer; }
    .ot { color: #fbbf24; font-weight: 800; }
    .reg { color: #34d399; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <h1 class="title">L&T Time Calculator (24H)</h1>
        <div style="font-size:11px;color:#94a3b8">Cycle: 26 Sep – 25 Oct 2026 • ASAD ALI (SA24M013)</div>
      </div>
      <span class="badge">8h Duty + 1h Break = 9h Shift</span>
    </div>
    <div class="grid" id="summaryGrid"></div>
  </div>

  <div class="card" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
    <span style="font-size:12px;font-weight:700;color:#38bdf8;">Master Check-In (24H):</span>
    <input id="masterIn" class="t24" value="05:30" maxlength="5" />
    <button class="btn" onclick="applyMasterIn()">Apply to All (Skip Friday)</button>
  </div>

  <div class="card" style="overflow-x:auto;padding:0;">
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Status</th>
          <th>In (24H)</th>
          <th>Out (24H)</th>
          <th>Net</th>
          <th>Reg</th>
          <th>OT</th>
        </tr>
      </thead>
      <tbody id="rowsBody"></tbody>
    </table>
  </div>

  <script>
    const rows = JSON.parse(localStorage.getItem('lnt_offline_rows_v1') || '${initialRowsJson.replace(/'/g, "\\'")}');
    function parseMins(t) {
      if (!t || !/^\\d{1,2}:\\d{2}$/.test(t)) return null;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    }
    function render() {
      localStorage.setItem('lnt_offline_rows_v1', JSON.stringify(rows));
      let totalNet = 0, totalReg = 0, totalOT = 0;
      const tbody = document.getElementById('rowsBody');
      tbody.innerHTML = '';
      rows.forEach((r, idx) => {
        const cIn = parseMins(r.checkIn);
        const cOut = parseMins(r.checkOut);
        let net = 0, reg = 0, ot = 0;
        if (cIn !== null && cOut !== null) {
          let raw = cOut >= cIn ? cOut - cIn : (1440 - cIn) + cOut;
          net = Math.max(0, raw - 60); // 1h fixed break
          if (r.status === 'weekly_off') {
            ot = net;
          } else {
            reg = Math.min(480, net);
            ot = Math.max(0, net - 480);
          }
        }
        totalNet += net; totalReg += reg; totalOT += ot;
        const mLabel = r.dayOfMonth >= 26 ? 'Sep' : 'Oct';
        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td><b>\${String(r.dayOfMonth).padStart(2,'0')} \${mLabel}</b></td>
          <td>\${r.status === 'weekly_off' ? '<span style="color:#38bdf8">Fri Off</span>' : 'Present'}</td>
          <td><input class="t24" value="\${r.checkIn}" onchange="updateRow(\${idx},'checkIn',this.value)" placeholder="--:--"/></td>
          <td><input class="t24" value="\${r.checkOut}" onchange="updateRow(\${idx},'checkOut',this.value)" placeholder="--:--"/></td>
          <td><b>\${(net/60).toFixed(1)}h</b></td>
          <td class="reg">\${(reg/60).toFixed(1)}h</td>
          <td class="ot">+\${(ot/60).toFixed(1)}h</td>
        \`;
        tbody.appendChild(tr);
      });
      document.getElementById('summaryGrid').innerHTML = \`
        <div class="stat"><div class="stat-label">Actual Worked</div><div class="stat-val">\${(totalNet/60).toFixed(1)}h</div></div>
        <div class="stat"><div class="stat-label">Regular (8h/day)</div><div class="stat-val" style="color:#34d399">\${(totalReg/60).toFixed(1)}h</div></div>
        <div class="stat"><div class="stat-label">Total Overtime</div><div class="stat-val" style="color:#fbbf24">+\${(totalOT/60).toFixed(1)}h</div></div>
      \`;
    }
    function updateRow(i, field, val) {
      rows[i][field] = val.trim();
      render();
    }
    function applyMasterIn() {
      const v = document.getElementById('masterIn').value.trim();
      rows.forEach(r => { if (r.status !== 'weekly_off') r.checkIn = v; });
      render();
    }
    render();
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'LNT_Time_Calculator_Android_Offline.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadCapacitorConfig() {
  const config = {
    appId: 'com.lnt.timecalculator',
    appName: 'L&T Time Calculator',
    webDir: 'dist',
    server: {
      androidScheme: 'https',
    },
    buildInstructions: [
      '1. npm install @capacitor/core @capacitor/cli @capacitor/android',
      '2. npx cap add android',
      '3. npm run build && npx cap sync android',
      '4. cd android && ./gradlew assembleDebug',
      '5. Output APK: android/app/build/outputs/apk/debug/app-debug.apk',
    ],
  };
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'capacitor.config.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const liveUrl =
    typeof window !== 'undefined' && window.location.origin.includes('run.app')
      ? window.location.origin
      : SHARED_APP_URL;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleDirectInstall = async () => {
    if (isInstallable) {
      await install();
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      <div className="inline-flex items-center gap-1.5">
        <a
          href="/LNT-Time-Calculator.apk"
          download="LNT-Time-Calculator.apk"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-3 py-1.5 text-xs font-extrabold text-white shadow-md shadow-emerald-600/20 transition active:scale-95"
          aria-label="Download LNT-Time-Calculator.apk"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download .APK (1.4 MB)</span>
        </a>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs font-semibold text-sky-400 transition"
          aria-label="Android APK and Install Options"
          title="More APK & Install Options"
        >
          <Smartphone className="w-3.5 h-3.5" />
        </button>
      </div>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Download Install-Ready LNT-Time-Calculator.apk
                    </h3>
                    <p className="text-xs text-slate-400">
                      Signed Android APK (1.4 MB) included directly in app &amp; GitHub repo
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {/* DIRECT SIGNED .APK DOWNLOAD */}
                <div className="bg-emerald-950/50 border border-emerald-500/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Install-Ready Signed Android .APK (1.4 MB)
                    </span>
                    <span className="text-[10px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-600">
                      com.lnt.timecalculator
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    <strong><code>LNT-Time-Calculator.apk</code></strong> is already compiled, signed, and saved directly inside this project (both at <code>/LNT-Time-Calculator.apk</code> and <code>/apk/LNT-Time-Calculator.apk</code> for GitHub):
                  </p>
                  <div className="pt-1">
                    <a
                      href="/LNT-Time-Calculator.apk"
                      download="LNT-Time-Calculator.apk"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download LNT-Time-Calculator.apk Now (1.4 MB)</span>
                    </a>
                  </div>
                </div>

                {/* OPTION 2: Direct Android Chrome WebAPK Install */}
                <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Direct Android Install (WebAPK — Instant)
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700">
                      No Wait
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Open this app link in <strong>Chrome on your Android phone</strong> and tap{' '}
                    <strong>&ldquo;Install App&rdquo;</strong> (or Chrome menu <strong>⋮ → Install app</strong>).
                    Android automatically compiles and installs a native <strong>L&amp;T Time Calculator APK</strong> onto your phone!
                  </p>

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {isInstallable && (
                      <button
                        type="button"
                        onClick={handleDirectInstall}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Install App Now
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition"
                    >
                      {copiedUrl ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied App Link!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy App Link for Android Chrome</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* OPTION 3: Cloud .APK File Compiler (PWABuilder) */}
                <div className="bg-slate-950/90 border border-blue-500/30 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <Package className="w-4 h-4" />
                      Compile Downloadable .APK File (PWABuilder)
                    </span>
                    <span className="text-[10px] bg-blue-950 text-sky-300 px-2 py-0.5 rounded-full border border-blue-800">
                      192px &amp; 512px Icons Ready
                    </span>
                  </div>
                  <div className="pt-1 flex items-center gap-2 flex-wrap">
                    <a
                      href={`https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(liveUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in PWABuilder (.APK Generator)</span>
                    </a>
                  </div>
                </div>

                {/* OPTION 3: Download Single-File Offline Android App & Capacitor Config */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <FileCode2 className="w-4 h-4" />
                    Option 3: Download Offline Mobile Package / Capacitor Config
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Download a 100% self-contained offline mobile file directly to your phone (with your{' '}
                    <strong>26 Sep – 25 Oct</strong> sheet embedded), or download the{' '}
                    <code>capacitor.config.json</code> to compile with Android Studio.
                  </p>
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <button
                      type="button"
                      onClick={downloadStandaloneMobileApp}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Offline Android File (.html)</span>
                    </button>

                    <button
                      type="button"
                      onClick={downloadCapacitorConfig}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                    >
                      <FileCode2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Download capacitor.config.json</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
