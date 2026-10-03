# 🚩 Recruitment Interview Dashboard (स्वराज्य)

A dedicated, high-performance, mobile-responsive web dashboard tailored for conducting, tracking, and evaluating club and organization recruitment interviews. Built with React 19, TypeScript, and Vite, styled in the signature dark obsidian Swarajya aesthetic.

![Recruitment Interview Dashboard](public/logo.png)

---

## ⚡ Features

- **4 Dedicated Interview Panels**:
  - **Panel 1** (Saffron `#FF6B35`): Naman Ghodake, Atharva Deshpande, Rashi Palod, Shunyam Firke
  - **Panel 2** (Emerald Green `#1fae5f`): Atharava Chougule, Sai Kadam, Ankana
  - **Panel 3** (Sky Blue `#38bdf8`): Omkar Japtap, Sharanya, Om Jadhav
  - **Panel 4** (Purple `#a855f7`): Shravani, Pranav, Riddh, Om Deshmukh
  - *(Panel 5 strictly excluded per requirements)*

- **Structured 30-Minute Interview Slots (15-min intervals)**:
  - **Slot 1**: `10:30 - 11:00 AM`
  - **Slot 2**: `11:15 - 11:45 AM`
  - **Slot 3**: `12:00 - 12:30 PM`
  - **Slot 4**: `12:45 - 1:15 PM`
  - **Slot 5**: `3:00 - 3:30 PM` (Post-lunch session)
  - **Slot 6**: `3:45 - 4:15 PM` (Overflow)
  - **Slot 7**: `4:30 - 5:00 PM` (Overflow)

- **Candidate Management & Instant Actions**:
  - Direct Phone Call (`tel:+91...`)
  - WhatsApp Direct Chat (`wa.me`) with prefilled personalized recruitment messages
  - One-click Phone Number Copy with toast notifications
  - Live Interview Status updates (`Scheduled`, `Interviewing`, `Completed`, `On Hold`, `Absent`)
  - Slot Reassignment on-the-fly via card dropdown
  - Candidate Evaluation Modal with score (0–10), interview notes, and domain preference analysis

- **Flexible Multi-View Layout**:
  - **By Slot View**: Grouped accordion-style cards for each 30-minute block
  - **By Panel View**: 4-column kanban board layout
  - **Table View**: High-density admin table layout

- **Data Ingestion & Export**:
  - Multi-sheet Excel (`.xlsx`) parser using SheetJS (Row 1: Interviewers, Row 2+: Candidates)
  - CSV parser with PapaParse
  - Export to `.xlsx` (multi-sheet workbook) and `.csv`
  - Downloadable Excel template for new recruitment drives

- **Persistence & Cloud Sync**:
  - `LocalStorage` cache under `recruitment_interview_members_v1`
  - Bytebin short URL generation (`#id=<short_id>`) with fallback to LZ-string URL hashing

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Icons**: `lucide-react`
- **Parsing**: `xlsx` (SheetJS) & `papaparse`
- **Compression**: `lz-string`
- **Styling**: Pure CSS design tokens following `style.md` specifications
- **Fonts**: `'Yatra One'`, `'Kalam'`, `'Poppins'`, `'Inter'` via Google Fonts

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v9+)

### Installation

```bash
# Clone the repository
git clone https://github.com/naman1326/recruitment-dashboard.git
cd recruitment-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
# Type check and build bundle
npm run build

# Preview build locally
npm run preview
```

---

## 📄 License

MIT © [naman1326](https://github.com/naman1326)
