/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Language } from '../types/timesheet';

export interface Translations {
  appName: string;
  appSubtitle: string;
  totalWorked: string;
  regularDuty: string;
  overtime: string;
  weeklyOffDays: string;
  scheduledRegularHours: string;
  regularHoursPercentage: string;
  overtimePercentage: string;
  totalAttendance: string;
  absentDays: string;
  leaveDays: string;
  incompleteEntries: string;
  month: string;
  year: string;
  settings: string;
  dailyDutyHours: string;
  weeklyOffDay: string;
  weeklyOffMode: string;
  offDayExcluded: string;
  offDayExcludedDesc: string;
  offDayIncluded: string;
  offDayIncludedDesc: string;
  calculationMethod: string;
  methodMonthlyCap: string;
  methodMonthlyCapDesc: string;
  methodDailyOT: string;
  methodDailyOTDesc: string;
  laborPolicyWarning: string;
  date: string;
  day: string;
  checkIn: string;
  checkOut: string;
  breakDuration: string;
  netHours: string;
  status: string;
  notes: string;
  actions: string;
  present: string;
  weeklyOff: string;
  publicHoliday: string;
  sickLeave: string;
  annualLeave: string;
  absent: string;
  halfDay: string;
  incompleteWarning: string;
  overnightBadge: string;
  quickEntry: string;
  batchFill: string;
  copyYesterday: string;
  clearMonth: string;
  exportReport: string;
  printReport: string;
  downloadExcel: string;
  downloadCSV: string;
  shareReport: string;
  employeeProfile: string;
  employeeName: string;
  companyName: string;
  projectSite: string;
  hourlyRate: string;
  overtimeMultiplier: string;
  estimatedGrossPay: string;
  employeeSignature: string;
  supervisorSignature: string;
  backupRestore: string;
  exportJSON: string;
  importJSON: string;
  resetDefaults: string;
  saveChanges: string;
  close: string;
  cancel: string;
  apply: string;
  allDays: string;
  weekdaysOnly: string;
  customRange: string;
  editDay: string;
  fridaySummaryTitle: string;
  totalFridaysInMonth: string;
  fridaysWorked: string;
  fridaysOff: string;
  fridayHoursWorked: string;
  fridayOvertimeHours: string;
  timeFormat: string;
  language: string;
  theme: string;
  installApp: string;
  offlineNotice: string;
  manualOverride: string;
  overrideScheduledHours: string;
  hours: string;
  minutes: string;
  // New L&T features
  masterCheckInTitle: string;
  masterCheckInSubtitle: string;
  applyCheckInAll: string;
  applyShiftAll: string;
  fixedDutyBadge: string;
  scanSheetBtn: string;
  scanSheetTitle: string;
  scanSheetSubtitle: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'L&T Time Calculator',
    appSubtitle: '8h Duty + 1h Fixed Break (9h Shift) & Overtime Engine',
    totalWorked: 'Total Net Worked',
    regularDuty: 'Regular Duty (8h/day)',
    overtime: 'Overtime',
    weeklyOffDays: 'Weekly Off Days',
    scheduledRegularHours: 'Scheduled Regular Hours',
    regularHoursPercentage: 'Regular Hours',
    overtimePercentage: 'Overtime Hours',
    totalAttendance: 'Attendance Days',
    absentDays: 'Absent Days',
    leaveDays: 'Leave Days',
    incompleteEntries: 'Incomplete Entries',
    month: 'Month',
    year: 'Year',
    settings: 'Timesheet Setup & Policy',
    dailyDutyHours: 'Daily Regular Duty Limit (Net)',
    weeklyOffDay: 'Weekly Off Day(s)',
    weeklyOffMode: 'Weekly Off Calculation Mode',
    offDayExcluded: 'Off Day Excluded from Regular Duty',
    offDayExcludedDesc: 'Off days do not contribute to scheduled duty. All work on off days counts as Overtime.',
    offDayIncluded: 'Off Day Included in Regular Duty',
    offDayIncludedDesc: 'Off day is treated as a regular scheduled day. Hours contribute towards regular duty limit.',
    calculationMethod: 'Overtime Allocation Engine',
    methodMonthlyCap: 'Method A: Monthly Cap',
    methodMonthlyCapDesc: 'Regular duty is capped at scheduled monthly hours; any hours beyond become overtime.',
    methodDailyOT: 'Method B: Daily Overtime (8h Net + 1h Break)',
    methodDailyOTDesc: 'Daily net hours exceeding 8h regular duty (9h total shift with 1h break) become overtime.',
    laborPolicyWarning: 'Notice: Fixed 8h regular duty + 1h break (9h total shift). Overtime classification follows company policy.',
    date: 'Date',
    day: 'Day',
    checkIn: 'Check-In',
    checkOut: 'Check-Out',
    breakDuration: 'Break (Fixed 1h)',
    netHours: 'Net Hours',
    status: 'Attendance Status',
    notes: 'Notes',
    actions: 'Actions',
    present: 'Present',
    weeklyOff: 'Weekly Off',
    publicHoliday: 'Public Holiday',
    sickLeave: 'Sick Leave',
    annualLeave: 'Annual Leave',
    absent: 'Absent',
    halfDay: 'Half Day',
    incompleteWarning: 'Incomplete time entry (missing check-in or check-out). Not counted in totals.',
    overnightBadge: 'Overnight Shift',
    quickEntry: 'Quick Entry',
    batchFill: 'Batch Fill Shifts',
    copyYesterday: 'Copy Yesterday',
    clearMonth: 'Clear Month Shifts',
    exportReport: 'Export & Share',
    printReport: 'Print / Save PDF',
    downloadExcel: 'Download Excel (.xlsx)',
    downloadCSV: 'Download CSV',
    shareReport: 'Share Timesheet',
    employeeProfile: 'Worker & Project Profile',
    employeeName: 'Employee / Technician Name',
    companyName: 'Company Name',
    projectSite: 'Site / Project Location',
    hourlyRate: 'Hourly Base Rate',
    overtimeMultiplier: 'Overtime Rate Multiplier',
    estimatedGrossPay: 'Estimated Gross Payout',
    employeeSignature: 'Employee Signature',
    supervisorSignature: 'Supervisor / Manager Signature',
    backupRestore: 'Data Backup & Restore',
    exportJSON: 'Export JSON Backup',
    importJSON: 'Import JSON Backup',
    resetDefaults: 'Reset to L&T Defaults (8h + 1h)',
    saveChanges: 'Save Changes',
    close: 'Close',
    cancel: 'Cancel',
    apply: 'Apply Shift',
    allDays: 'All Calendar Days',
    weekdaysOnly: 'Working Days Only (Skip Weekly Offs)',
    customRange: 'Specific Date Range',
    editDay: 'Edit Day Shift',
    fridaySummaryTitle: 'Smart Weekly Off / Friday Engine',
    totalFridaysInMonth: 'Total Fridays in Month',
    fridaysWorked: 'Fridays Worked',
    fridaysOff: 'Fridays Off',
    fridayHoursWorked: 'Total Worked on Fridays',
    fridayOvertimeHours: 'Friday Overtime Hours',
    timeFormat: 'Time Format',
    language: 'Language',
    theme: 'Theme',
    installApp: 'Install L&T Time Calculator',
    offlineNotice: 'Offline Mode: All data saved locally on device',
    manualOverride: 'Manual Scheduled Hours Override',
    overrideScheduledHours: 'Manual Override (Hours)',
    hours: 'Hours',
    minutes: 'Minutes',
    masterCheckInTitle: 'One-Click Check-In Control (Auto-Skips Friday)',
    masterCheckInSubtitle: 'Set Check-In time for all working days at once (Fridays stay off automatically) or edit any day manually below',
    applyCheckInAll: 'Apply Check-In to All (Skip Friday)',
    applyShiftAll: 'Apply Full 9h Shift (8h+1h)',
    fixedDutyBadge: '8h Duty + 1h Break = 9h Shift',
    scanSheetBtn: 'Scan Sheet (Auto-Fill)',
    scanSheetTitle: 'Smart Timesheet Scanner & Auto-Fill',
    scanSheetSubtitle: 'Upload a photo of your timecard/attendance sheet or Excel file to auto-fill all daily rows',
  },
  ur: {
    appName: 'ایل اینڈ ٹی ٹائم کیلکولیٹر',
    appSubtitle: '8 گھنٹے ڈیوٹی + 1 گھنٹہ بریک (9 گھنٹے شفٹ) اور اوور ٹائم',
    totalWorked: 'کل خالص کام کے گھنٹے',
    regularDuty: 'باقاعدہ ڈیوٹی (8h)',
    overtime: 'اوور ٹائم',
    weeklyOffDays: 'ہفتہ وار چھٹیاں',
    scheduledRegularHours: 'مقررہ ڈیوٹی گھنٹے',
    regularHoursPercentage: 'باقاعدہ اوقات',
    overtimePercentage: 'اوور ٹائم اوقات',
    totalAttendance: 'حاضری کے دن',
    absentDays: 'غیر حاضری کے دن',
    leaveDays: 'رخصت کے دن',
    incompleteEntries: 'نامکمل اندراجات',
    month: 'مہینہ',
    year: 'سال',
    settings: 'ٹائم شیٹ سیٹ اپ اور قواعد',
    dailyDutyHours: 'روزانہ ڈیوٹی کی حد (8 گھنٹے)',
    weeklyOffDay: 'ہفتہ وار چھٹی کا دن',
    weeklyOffMode: 'چھٹی کے دن کا حساب کتاب',
    offDayExcluded: 'چھٹی باقاعدہ ڈیوٹی سے خارج',
    offDayExcludedDesc: 'چھٹی کے دن کیا گیا سارا کام مکمل اوور ٹائم شمار ہوگا۔',
    offDayIncluded: 'چھٹی باقاعدہ ڈیوٹی میں شامل',
    offDayIncludedDesc: 'چھٹی کے دن کیا گیا کام ماہانہ ریگولر ڈیوٹی میں شمار ہوگا۔',
    calculationMethod: 'اوور ٹائم کا طریقہ کار',
    methodMonthlyCap: 'طریقہ A: ماہانہ حد (Monthly Cap)',
    methodMonthlyCapDesc: 'ماہانہ مقررہ اوقات کے بعد تمام کام اوور ٹائم شمار ہوگا۔',
    methodDailyOT: 'طریقہ B: روزانہ اوور ٹائم (8h + 1h بریک)',
    methodDailyOTDesc: 'روزانہ 8 گھنٹے ڈیوٹی (مع 1 گھنٹہ بریک = 9 گھنٹے) سے زیادہ کام اوور ٹائم شمار ہوگا۔',
    laborPolicyWarning: 'تنبیہ: 8 گھنٹے ڈیوٹی + 1 گھنٹہ بریک (کل 9 گھنٹے شفٹ) مقرر ہے۔',
    date: 'تاریخ',
    day: 'دن',
    checkIn: 'آمد کا وقت (In)',
    checkOut: 'روانگی کا وقت (Out)',
    breakDuration: 'وقفہ (1h مقرر)',
    netHours: 'خالص گھنٹے',
    status: 'حاضری کی حالت',
    notes: 'نوٹس',
    actions: 'اقدامات',
    present: 'حاضر',
    weeklyOff: 'ہفتہ وار چھٹی',
    publicHoliday: 'سرکاری چھٹی',
    sickLeave: 'بیماری کی رخصت',
    annualLeave: 'سالانہ چھٹی',
    absent: 'غیر حاضر',
    halfDay: 'نصف دن',
    incompleteWarning: 'نامکمل ٹائم انٹری (چیک ان یا چیک آؤٹ غائب ہے۔ ٹوٹل میں شامل نہیں)۔',
    overnightBadge: 'نائٹ شفٹ',
    quickEntry: 'فوری اندراج',
    batchFill: 'ایک ساتھ شفٹ درج کریں',
    copyYesterday: 'کل والی شفٹ کاپی کریں',
    clearMonth: 'مہینہ صاف کریں',
    exportReport: 'رپورٹ اور شیئر',
    printReport: 'پرنٹ / پی ڈی ایف',
    downloadExcel: 'ایکسل (.xlsx) ڈاؤن لوڈ',
    downloadCSV: 'سی ایس وی ڈاؤن لوڈ',
    shareReport: 'ٹائم شیٹ شیئر کریں',
    employeeProfile: 'ملازم اور پروجیکٹ پروفائل',
    employeeName: 'ملازم / ٹیکنیشن کا نام',
    companyName: 'کمپنی کا نام',
    projectSite: 'سائٹ / پروجیکٹ',
    hourlyRate: 'فی گھنٹہ اجرت',
    overtimeMultiplier: 'اوور ٹائم ریٹ',
    estimatedGrossPay: 'کل متوقع تنخواہ / اجرت',
    employeeSignature: 'ملازم کے دستخط',
    supervisorSignature: 'نگران / سپروائزر کے دستخط',
    backupRestore: 'بیک اپ اور بحالی',
    exportJSON: 'ڈیٹا بیک اپ محفوظ کریں',
    importJSON: 'بیک اپ بحال کریں',
    resetDefaults: 'ایل اینڈ ٹی ترتیبات (8h + 1h)',
    saveChanges: 'تبدیلیاں محفوظ کریں',
    close: 'بند کریں',
    cancel: 'منسوخ کریں',
    apply: 'شفٹ لاگو کریں',
    allDays: 'تمام دن',
    weekdaysOnly: 'صرف کام کے دن (جمعہ چھوڑ کر)',
    customRange: 'مخصوص تاریخیں',
    editDay: 'شفٹ میں ترمیم کریں',
    fridaySummaryTitle: 'جمعہ / ہفتہ وار چھٹی کا جائزہ',
    totalFridaysInMonth: 'مہینے میں کل جمعہ',
    fridaysWorked: 'جمعہ کے دن کام',
    fridaysOff: 'جمعہ کے دن چھٹی',
    fridayHoursWorked: 'جمعہ پر کل کام کے گھنٹے',
    fridayOvertimeHours: 'جمعہ کا اوور ٹائم',
    timeFormat: 'ٹائم فارمیٹ',
    language: 'زبان',
    theme: 'تھیم',
    installApp: 'ایل اینڈ ٹی ایپ انسٹال کریں',
    offlineNotice: 'آف لائن موڈ: سارا ڈیٹا آپ کے موبائل پر محفوظ ہے',
    manualOverride: 'ماہانہ ڈیوٹی اوقات خود درج کریں',
    overrideScheduledHours: 'مخصوص ماہانہ گھنٹے',
    hours: 'گھنٹے',
    minutes: 'منٹ',
    masterCheckInTitle: 'ایک کلک میں سب کا چیک ان ٹائم لگائیں (جمعہ چھوڑ کر)',
    masterCheckInSubtitle: 'اوپر باکس میں چیک ان ٹائم لکھیں اور بٹن دبائیں، جمعہ کے علاوہ سب دنوں پر خودکار لگ جائے گا',
    applyCheckInAll: 'سب پر چیک ان لگائیں (جمعہ چھوڑ کر)',
    applyShiftAll: 'پوری شفٹ لگائیں (8h+1h)',
    fixedDutyBadge: '8h ڈیوٹی + 1h بریک = 9h شفٹ',
    scanSheetBtn: 'شیٹ اسکین کریں (Auto-Fill)',
    scanSheetTitle: 'ٹائم شیٹ اسکینر اور آٹو فل',
    scanSheetSubtitle: 'حاضری شیٹ کی تصویر یا ایکسل فائل اپ لوڈ کریں تاکہ پورا مہینہ خودکار فل ہو جائے',
  },
};
