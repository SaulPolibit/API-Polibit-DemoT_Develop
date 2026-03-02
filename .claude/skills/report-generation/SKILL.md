---
name: report-generation
description: "Activate when working with ILPA reports, capital account statements, fee reports, PDF generation, Excel reports, capital call notices, or distribution notices. Trigger phrases: 'ILPA', 'report', 'PDF', 'Excel', 'capital account', 'fee report', 'capital call notice', 'distribution notice', 'pdfkit', 'waterfall'. NOT for DocuSeal document signing (use docuseal-backend)."
---

# Report Generation — ILPA Reports, Capital Accounts & PDFs

## Purpose

This skill covers all report and document generation: ILPA compliance reports (PDF + Excel), fee reports with dual-rate calculations, capital account statements, capital call notice PDFs, and distribution notice PDFs. All generators use PDFKit for PDF output and custom CSV/Excel generation.

## Architecture

```
src/services/ilpaReportService.js         → ILPA calculation engine (IRR, TVPI, DPI, RVPI)
src/services/ilpaReportPdfGenerator.js    → ILPA PDF reports (722 lines)
src/services/ilpaReportExcelGenerator.js  → ILPA Excel/CSV reports (281 lines)
src/services/feeReportGenerator.js        → Fee & Expense reports (451 lines)
src/services/capitalAccountGenerator.js   → Capital account statements (581 lines)
src/services/documentGenerator.js         → Capital call + distribution notices (1,303 lines)
src/routes/ilpaReport.routes.js           → ILPA report endpoints
src/routes/feeReport.routes.js            → Fee report endpoints
src/routes/capitalAccount.routes.js       → Capital account endpoints
```

## Key Files

| File | Size | Purpose |
|------|------|---------|
| `src/services/documentGenerator.js` | 1,303 lines | Capital call notices (fund + individual LP), distribution notices (fund + individual LP) |
| `src/services/ilpaReportPdfGenerator.js` | 722 lines | Performance, quarterly, and CCD reports as PDF |
| `src/services/capitalAccountGenerator.js` | 581 lines | Capital account statement PDF |
| `src/services/feeReportGenerator.js` | 451 lines | Fee report PDF + Excel |
| `src/services/ilpaReportService.js` | 324 lines | IRR (Newton-Raphson), TVPI, DPI, RVPI, MOIC calculations |
| `src/services/ilpaReportExcelGenerator.js` | 281 lines | ILPA Excel reports with CSV fallback |

## Environment Variables

No specific env vars — these services use the Supabase database connection (from `supabase-database` skill) and `pdfkit` library.

## Dependencies

| Package | Usage |
|---------|-------|
| `pdfkit` | PDF generation (all generators) |
| Custom CSV | Excel generation with CSV fallback |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/ilpa-reports/performance/:structureId` | Bearer | Generate ILPA performance report (PDF) |
| GET | `/api/ilpa-reports/quarterly/:structureId` | Bearer | Generate ILPA quarterly report (PDF) |
| GET | `/api/ilpa-reports/ccd/:structureId` | Bearer | Generate CCD report (PDF) |
| GET | `/api/ilpa-reports/performance/:structureId/excel` | Bearer | Generate performance report (Excel) |
| GET | `/api/ilpa-reports/quarterly/:structureId/excel` | Bearer | Generate quarterly report (Excel) |
| GET | `/api/ilpa-reports/ccd/:structureId/excel` | Bearer | Generate CCD report (Excel) |
| GET | `/api/fee-reports/:structureId` | Bearer | Generate fee report (PDF) |
| GET | `/api/fee-reports/:structureId/excel` | Bearer | Generate fee report (Excel) |
| GET | `/api/capital-account/:structureId/:investorId` | Bearer | Generate capital account statement (PDF) |

## Report Types

### 1. ILPA Performance Report
- Fund information summary
- Performance metrics (IRR, TVPI, DPI, RVPI, MOIC)
- Capital summary (committed, called, distributed)
- Investment period tracking

### 2. ILPA Quarterly Report
- Quarterly activity breakdown (capital calls and distributions per quarter)
- Quarter-over-quarter performance metrics
- Running totals and cumulative figures

### 3. ILPA CCD Report (Capital Calls & Distributions)
- Detailed capital call history with running balances
- Distribution history with running balances
- Net cash flow calculation

### 4. Fee & Expense Report
- Fund-level fee summary
- Per-investor fee breakdown
- Dual-rate fee calculations (different rates for different commitment tiers)
- ILPA-compliant format

### 5. Capital Account Statement
- Opening/closing balance
- Capital call activity in period
- Distribution activity in period
- Fee summary
- Balance continuity

### 6. Capital Call Notice
- Fund-wide notice with all LP allocations
- Individual LP-specific notice
- Payment instructions
- Fee breakdowns

### 7. Distribution Notice
- Fund-wide notice with all LP allocations
- Individual LP-specific notice
- Source breakdown (income, capital gains, return of capital)
- Waterfall analysis

## Common Tasks

### Generate an ILPA performance report
```javascript
const ilpaService = require('../services/ilpaReportService');
const pdfGenerator = require('../services/ilpaReportPdfGenerator');

// 1. Calculate metrics
const metrics = await ilpaService.calculatePerformanceMetrics(structureId);

// 2. Generate PDF buffer
const pdfBuffer = await pdfGenerator.generatePerformanceReportPDF(metrics);

// 3. Send as response
res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', 'attachment; filename="performance-report.pdf"');
res.send(pdfBuffer);
```

### Generate a capital call notice PDF
```javascript
const docGen = require('../services/documentGenerator');

// Fund-wide notice
const pdfBuffer = await docGen.generateCapitalCallNoticePDF(capitalCallData);

// Individual LP notice
const lpPdf = await docGen.generateIndividualLPNoticePDF(capitalCallData, investorData);
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| PDF generation fails | Missing data fields | Check that structure, capital calls, and distributions exist in DB |
| IRR calculation returns NaN | No cash flows or all same direction | Ensure both capital calls (negative) and distributions (positive) exist |
| Excel fallback to CSV | ExcelJS dependency issue | CSV fallback is automatic; check ExcelJS installation |
| Empty report | No data for the period | Verify date range and structure ID |
| PDF styling issues | PDFKit version mismatch | Check `pdfkit` version in package.json (v0.17.2) |

## References

- [ILPA Reporting Pipeline](references/ilpa-reporting.md)
- [PDF Generator Patterns](references/pdf-generators.md)
