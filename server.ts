/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 timesheet images
  app.use(express.json({ limit: '20mb' }));

  // POST /api/scan-timesheet - Fast OCR extraction for 26-to-25 L&T timesheets
  app.post('/api/scan-timesheet', async (req, res) => {
    try {
      const { imageBase64, mimeType, rawText, year, month, expectedDays } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const cycleGuide = Array.isArray(expectedDays) && expectedDays.length > 0
        ? `Expected sequential day numbers from top row to bottom row: [${expectedDays.join(', ')}].`
        : `Standard L&T payroll cycle runs from the 26th of the previous month (top row = 26, 27, 28, 29, 30, [31]) down to the 25th of the current month (1, 2, 3, ..., 22, 23, 24, 25 at the bottom row).`;

      const promptText = `Fast & exact OCR for L&T Time Calculator timesheet (24-hour format, 26th-to-25th cycle).
${cycleGuide}

CRITICAL RULES:
1. COUNT ROWS TOP-TO-BOTTOM (26 TO 25): The table rows always go sequentially from Day 26 at the top down to Day 25 at the bottom. If the printed Date on the left column is faded, washed out, or invisible (for example rows 23, 24, 25 at the bottom), DO NOT skip those rows! Count the rows from top to bottom following the sequence (26..30/31, then 1..25) and extract the handwritten "In time" and "Out time" on those rows.
2. STRICT 24-HOUR TIME (NO AM/PM CONVERSION): Times on the sheet are ALREADY written in 24-hour format (e.g. "5:30" = "05:30", "20:00" = "20:00", "15:00" = "15:00", "7:00" = "07:00", "19:00" = "19:00", "6:00" = "06:00", "12:00" = "12:00", "14:00" = "14:00"). Zero-pad single-digit hours to HH:MM. NEVER convert "7:00" to "19:00" (15:00 to 07:00 is an overnight shift).
3. N/F/H COLUMN & FRIDAYS: If the column says "F" (Friday), set status to "weekly_off" (even if worked, Friday overtime is tracked on weekly_off days). Otherwise set status to "present".
4. Incomplete rows: If a row has only In time (e.g. "05:30") and blank Out time, return checkIn: "05:30" and checkOut: "".
5. Detect header metadata if visible: employeeName (NAME), employeeId (IQAMA NO / JOB CODE), projectName (LOCATION), and startMonth (1-12 for the month of the first row Day 26, e.g. 9 if row 1 is 26-Sep).`;

      const parts: any[] = [];
      if (imageBase64 && mimeType) {
        parts.push({
          inlineData: {
            data: imageBase64,
            mimeType,
          },
        });
      }
      if (rawText) {
        parts.push({
          text: `Timesheet Text Content:\n${rawText}`,
        });
      }
      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              employeeName: {
                type: Type.STRING,
                description: 'Detected employee name if visible',
              },
              employeeId: {
                type: Type.STRING,
                description: 'Detected job code or Iqama/badge ID if visible',
              },
              projectName: {
                type: Type.STRING,
                description: 'Detected site location if visible',
              },
              startMonth: {
                type: Type.INTEGER,
                description: 'Month number (1-12) of the first row (Day 26), e.g. 9 for 26-Sep',
              },
              startYear: {
                type: Type.INTEGER,
                description: '4-digit year of the first row, e.g. 2026',
              },
              entries: {
                type: Type.ARRAY,
                description: 'All daily rows from top (26) to bottom (25)',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    rowNumber: {
                      type: Type.INTEGER,
                      description: '1-based row index from top of table (1, 2, 3...)',
                    },
                    dayOfMonth: {
                      type: Type.INTEGER,
                      description: 'Day number (26..31 then 1..25)',
                    },
                    checkIn: {
                      type: Type.STRING,
                      description: '24-hour HH:MM (e.g. 05:30, 06:00, 15:00) or empty string',
                    },
                    checkOut: {
                      type: Type.STRING,
                      description: '24-hour HH:MM (e.g. 20:00, 19:00, 07:00, 12:00, 14:00) or empty string',
                    },
                    status: {
                      type: Type.STRING,
                      description: 'present or weekly_off',
                    },
                  },
                  required: ['rowNumber', 'dayOfMonth', 'checkIn', 'checkOut', 'status'],
                },
              },
            },
            required: ['entries'],
          },
        },
      });

      const textOutput = response.text || '{"entries":[]}';
      const parsed = JSON.parse(textOutput);
      return res.json(parsed);
    } catch (error: any) {
      console.error('Timesheet scan error:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to scan timesheet image.',
      });
    }
  });

  // Mount Vite middleware in development or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`L&T Time Calculator server running on http://localhost:${PORT}`);
  });
}

startServer();
