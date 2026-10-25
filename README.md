# DutyMate Pro — Workforce Timesheet & Overtime Engine

**DutyMate Pro** is a modern, high-precision timesheet and overtime calculation app designed specifically for technicians, HVAC specialists, industrial contractors, construction crews, and shift workers.

---

## 🌟 Key Features

### 1. High-Precision Overtime Engine
- **Zero Double-Counting**: Every single minute is strictly classified into Regular Duty, Overtime, or Unclassified.
- **Integer Minute Math**: All arithmetic operates on minutes internally before formatting to eliminate floating-point rounding errors.
- **Method A: Monthly Cap**: Regular duty is allocated up to the scheduled monthly limit; hours beyond become overtime.
- **Method B: Daily Overtime**: On each working day, hours exceeding the daily duty limit become overtime.
- **Overnight Shifts**: Automatically detects shifts spanning midnight (e.g., 20:00 to 06:00 = 10 hours).
- **Incomplete Shift Protection**: Missing check-in or check-out is flagged as incomplete and never included in confirmed working totals.

### 2. Smart Friday & Weekly-Off Management
- **Calendar-Based Counting**: Automatically calculates the exact number of Fridays/off days in any given month (e.g. 4 or 5 Fridays).
- **Policy Option 1**: Off Day is excluded from regular duty; all hours worked on off days count as 100% Overtime.
- **Policy Option 2**: Off Day is included in regular duty; hours worked contribute toward the monthly regular limit.
- **Dedicated Metrics**: Fridays worked, Fridays off, Total hours worked on Fridays, and Friday Overtime hours.

### 3. Professional Reports & Export
- **Excel (.xlsx)**: Formatted workbook with company profile, full monthly breakdown, totals, and signature blocks.
- **CSV**: Lightweight raw data export for spreadsheet compatibility.
- **Printable PDF View**: Built-in print styles with signature lines for employee and supervisor sign-offs.
- **Android Web Share**: Native share integration to send timesheet summaries instantly.

### 4. Technician & Mobile-First UX
- **Theme**: Dark navy & electric blue aesthetic with light/dark mode switch.
- **Bilingual**: English & Urdu (اردو) support.
- **Time Formats**: 12-hour (AM/PM) and 24-hour display toggle.
- **Quick Shift Tools**: "Batch Fill", "Copy Yesterday", inline edits, and Undo buffer.
- **Installable PWA**: Works offline with full local storage persistence.

---

## 🚀 Setup & Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Run Unit Tests**:
   ```bash
   npx tsx --test src/utils/engine.test.ts
   ```

4. **Build Production PWA**:
   ```bash
   npm run build
   ```

---

## 📜 License
Apache-2.0
