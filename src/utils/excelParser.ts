import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Candidate, PanelConfig, PanelType } from '../types';
import { TIME_SLOTS } from '../constants/panels';

export interface ParseResult {
  candidates: Candidate[];
  panelInterviewers: Partial<Record<PanelType, string[]>>;
  summary: {
    sheetCount: number;
    sheetsFound: string[];
    candidatesCount: number;
    perPanel: Record<string, number>;
  };
}

// Clean and normalize 10-digit mobile number
export function normalizePhone(raw: any): string {
  if (raw === null || raw === undefined) return '';
  let str = String(raw).trim();
  
  // Handle scientific notation or floats e.g. 8.850037356E9 or 8850037356.0
  if (/e/i.test(str) || /\./.test(str)) {
    const num = Number(str);
    if (!isNaN(num) && num > 0) {
      str = Math.floor(num).toString();
    }
  }

  // Remove non-digit characters
  const digits = str.replace(/\D/g, '');

  // Strip leading India country code 91 if 12 digits or 0 if 11 digits
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

const ALLOWED_PANELS: PanelType[] = ['Panel 1', 'Panel 2', 'Panel 3', 'Panel 4'];

export async function parseExcelFile(file: File): Promise<ParseResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  const candidates: Candidate[] = [];
  const panelInterviewers: Partial<Record<PanelType, string[]>> = {};
  const perPanel: Record<string, number> = {};
  const sheetsFound: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const cleanSheetName = sheetName.trim();
    // Exclude Panel 5 or any other sheets strictly
    const matchedPanel = ALLOWED_PANELS.find(
      p => p.toLowerCase() === cleanSheetName.toLowerCase()
    );

    if (!matchedPanel) {
      continue;
    }

    sheetsFound.push(matchedPanel);
    const worksheet = workbook.Sheets[sheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawRows || rawRows.length === 0) continue;

    // Row 1 (Index 0): Interviewers list
    const firstRow = rawRows[0] || [];
    const interviewers: string[] = [];
    for (let c = 0; c < Math.min(firstRow.length, 6); c++) {
      const val = String(firstRow[c] || '').trim();
      // Make sure it is not a header name like "Name" or "Roll"
      if (val && !/^(candidate|name|roll|phone|mobile|pref|domain)/i.test(val)) {
        interviewers.push(val);
      }
    }
    if (interviewers.length > 0) {
      panelInterviewers[matchedPanel] = interviewers;
    }

    // Row 2 onward: Candidate details
    let panelCandidateIndex = 0;
    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.length === 0) continue;

      const name = String(row[0] || '').trim();
      if (!name) continue; // Skip empty rows

      const rollNo = String(row[1] || '').trim();
      // Mobile can be in column 3 (index 3, Col D) or column 2 if format varies
      let rawPhone = row[3] !== undefined && row[3] !== '' ? row[3] : row[2];
      const phone = normalizePhone(rawPhone);

      // Domain preferences
      const domainPref1 = String(row[4] || '').trim();
      const domainPref2 = String(row[5] || '').trim();

      // Slot calculation: 5 candidates per slot
      const slotIndex = Math.min(Math.floor(panelCandidateIndex / 5), TIME_SLOTS.length - 1);
      const timeSlot = TIME_SLOTS[slotIndex].id;

      const pSlug = matchedPanel.toLowerCase().replace(/\s+/g, '-');
      const candidate: Candidate = {
        id: `${pSlug}-${Date.now()}-${panelCandidateIndex + 1}`,
        name,
        rollNo: rollNo || undefined,
        mobile: phone,
        panel: matchedPanel,
        timeSlot,
        slotIndex,
        domainPref1: domainPref1 || undefined,
        domainPref2: domainPref2 || undefined,
        status: 'scheduled',
        notes: '',
        createdAt: new Date().toISOString()
      };

      candidates.push(candidate);
      panelCandidateIndex++;
    }

    perPanel[matchedPanel] = panelCandidateIndex;
  }

  return {
    candidates,
    panelInterviewers,
    summary: {
      sheetCount: sheetsFound.length,
      sheetsFound,
      candidatesCount: candidates.length,
      perPanel
    }
  };
}

export function parseCSVData(csvText: string, defaultPanel: PanelType = 'Panel 1'): Promise<Candidate[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as any[][];
          if (!rows || rows.length === 0) {
            resolve([]);
            return;
          }

          const candidates: Candidate[] = [];
          // Detect if first row is header
          const startIdx = /name|candidate/i.test(String(rows[0][0])) ? 1 : 0;

          for (let i = startIdx; i < rows.length; i++) {
            const row = rows[i];
            const name = String(row[0] || '').trim();
            if (!name) continue;

            const rollNo = String(row[1] || '').trim();
            const phone = normalizePhone(row[3] || row[2] || '');
            const domainPref1 = String(row[4] || '').trim();
            const domainPref2 = String(row[5] || '').trim();

            const slotIndex = Math.min(Math.floor(candidates.length / 5), TIME_SLOTS.length - 1);
            const timeSlot = TIME_SLOTS[slotIndex].id;

            candidates.push({
              id: `csv-${Date.now()}-${i}`,
              name,
              rollNo: rollNo || undefined,
              mobile: phone,
              panel: defaultPanel,
              timeSlot,
              slotIndex,
              domainPref1: domainPref1 || undefined,
              domainPref2: domainPref2 || undefined,
              status: 'scheduled',
              notes: '',
              createdAt: new Date().toISOString()
            });
          }
          resolve(candidates);
        } catch (err) {
          reject(err);
        }
      },
      error: (err: Error) => reject(err)
    });
  });
}

// Export candidates to Excel workbook (.xlsx)
export function exportToExcel(candidates: Candidate[], panelConfigs: Record<PanelType, PanelConfig>) {
  const wb = XLSX.utils.book_new();

  for (const panel of ALLOWED_PANELS) {
    const panelCandidates = candidates.filter(c => c.panel === panel);
    const interviewers = panelConfigs[panel]?.interviewers || [];

    // Header row 1: Interviewers
    const rows: any[][] = [];
    rows.push(interviewers);

    // Header row 2: Column labels
    rows.push([
      'Name', 
      'Roll No', 
      'Status', 
      'Mobile', 
      'Domain Pref 1', 
      'Domain Pref 2', 
      'Preferred Department',
      'Why Good Fit & Skills',
      'Why Swarajya Club',
      'Time Slot', 
      'Notes'
    ]);

    // Data rows
    for (const c of panelCandidates) {
      rows.push([
        c.name,
        c.rollNo || '',
        c.status.toUpperCase(),
        c.mobile,
        c.domainPref1 || '',
        c.domainPref2 || '',
        c.preferredDept || '',
        c.fitReason || '',
        c.clubMotivation || '',
        c.timeSlot,
        c.notes || ''
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, panel);
  }

  XLSX.writeFile(wb, `Recruitment_Interview_Schedule_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// Export candidates to CSV
export function exportToCSV(candidates: Candidate[]) {
  const data = candidates.map(c => ({
    Panel: c.panel,
    Slot: c.timeSlot,
    Name: c.name,
    RollNo: c.rollNo || '',
    Mobile: c.mobile,
    Domain1: c.domainPref1 || '',
    Domain2: c.domainPref2 || '',
    PreferredDept: c.preferredDept || '',
    WhyGoodFit: c.fitReason || '',
    WhySwarajya: c.clubMotivation || '',
    Status: c.status,
    Notes: c.notes || ''
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Recruitment_Interview_Candidates_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Generate template Excel file
export function downloadExcelTemplate() {
  const wb = XLSX.utils.book_new();
  const sampleInterviewers: Record<PanelType, string[]> = {
    'Panel 1': ['Naman Ghodake', 'Atharva Deshpande', 'Rashi Palod', 'Shunyam Firke'],
    'Panel 2': ['Atharava Chougule', 'Sai Kadam', 'Ankana'],
    'Panel 3': ['Omkar Japtap', 'Sharanya', 'Om Jadhav'],
    'Panel 4': ['Shravani', 'Pranav', 'Riddh', 'Om Deshmukh']
  };

  for (const panel of ALLOWED_PANELS) {
    const rows: any[][] = [];
    rows.push(sampleInterviewers[panel]);
    rows.push(['Candidate Name', 'Registration No', '', 'Mobile Number', 'Domain Preference 1', 'Domain Preference 2']);
    rows.push(['Sample Candidate A', '26BCE1001', '', '9876543210', 'Technical', 'Operations']);
    rows.push(['Sample Candidate B', '26BCE1002', '', '9876543211', 'Design and Content', 'Cultural']);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, panel);
  }

  XLSX.writeFile(wb, 'Recruitment_Panel_Template.xlsx');
}
