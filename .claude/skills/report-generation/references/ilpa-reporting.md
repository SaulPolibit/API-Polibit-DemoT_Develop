---
title: "Reference: ILPA Reporting Pipeline"
created: 2026-03-01
updated: 2026-03-01
author: marsanem
status: active
---

# ILPA Reporting Pipeline

## Overview

ILPA (Institutional Limited Partners Association) reports provide standardized fund performance reporting. The pipeline: **Data Query → Calculation → Generation (PDF/Excel)**.

## Calculation Engine (`src/services/ilpaReportService.js`)

### IRR — Internal Rate of Return
```javascript
static calculateIRR(cashFlows, guess = 0.1) {
  // Newton-Raphson iterative method
  // cashFlows: [{ date: Date, amount: number }]
  // Negative amounts = capital calls (outflows)
  // Positive amounts = distributions (inflows)

  const maxIterations = 100;
  const tolerance = 0.00001;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;  // derivative

    for (const cf of cashFlows) {
      const years = daysBetween(cashFlows[0].date, cf.date) / 365.25;
      npv += cf.amount / Math.pow(1 + rate, years);
      dnpv -= years * cf.amount / Math.pow(1 + rate, years + 1);
    }

    const newRate = rate - npv / dnpv;

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }
    rate = newRate;
  }

  return rate;  // May not have converged
}
```

### Performance Metrics
```javascript
static async calculatePerformanceMetrics(structureId) {
  // Queries Supabase for structure, capital calls, distributions

  const structure = await Structure.findById(structureId);
  const capitalCalls = await CapitalCall.find({ structureId, status: 'completed' });
  const distributions = await Distribution.find({ structureId });

  const totalCommitted = structure.targetSize;
  const totalCalled = sum(capitalCalls.map(cc => cc.totalAmount));
  const totalDistributed = sum(distributions.map(d => d.totalAmount));
  const currentNAV = totalCalled - totalDistributed;  // Simplified

  return {
    // Fund info
    fundName: structure.name,
    currency: structure.currency,
    vintageYear: structure.createdAt.getFullYear(),

    // Capital summary
    totalCommitted,
    totalCalled,
    totalDistributed,
    paidInPercentage: (totalCalled / totalCommitted) * 100,

    // Performance metrics
    irr: this.calculateIRR(cashFlows),
    tvpi: (totalDistributed + currentNAV) / totalCalled,  // Total Value to Paid-In
    dpi: totalDistributed / totalCalled,                   // Distributions to Paid-In
    rvpi: currentNAV / totalCalled,                        // Residual Value to Paid-In
    moic: (totalDistributed + currentNAV) / totalCalled,   // Multiple on Invested Capital
  };
}
```

### Quarterly Activity
```javascript
static async calculateQuarterlyActivity(structureId, year) {
  // Groups capital calls and distributions by quarter

  return {
    quarters: [
      {
        quarter: 'Q1 2026',
        capitalCalled: 500000,
        distributed: 100000,
        netCashFlow: -400000,
        cumulativeCalled: 2000000,
        cumulativeDistributed: 500000,
      },
      // ... Q2, Q3, Q4
    ],
    annualSummary: { totalCalled, totalDistributed, netCashFlow },
  };
}
```

### CCD Summary (Capital Calls & Distributions)
```javascript
static async calculateCCDSummary(structureId) {
  // Detailed line-by-line capital call and distribution history
  // with running balances

  return {
    capitalCalls: [
      {
        date: '2026-01-15',
        callNumber: 1,
        amount: 500000,
        runningTotal: 500000,
        percentOfCommitment: 10,
      },
      // ...
    ],
    distributions: [
      {
        date: '2026-06-30',
        amount: 100000,
        type: 'income',
        runningTotal: 100000,
      },
      // ...
    ],
    summary: {
      totalCalled,
      totalDistributed,
      netContributed,
      unfundedCommitment,
    },
  };
}
```

## Data Flow

```
Structure (fund info)
   ├── Capital Calls (completed) → amounts, dates
   ├── Capital Call Allocations → per-investor breakdowns
   ├── Distributions → amounts, dates, types
   ├── Distribution Allocations → per-investor breakdowns
   └── Structure Investors → commitments, ownership %

         ↓

IlpaReportService.calculatePerformanceMetrics()
IlpaReportService.calculateQuarterlyActivity()
IlpaReportService.calculateCCDSummary()

         ↓

IlpaReportPdfGenerator.generatePerformanceReportPDF()
IlpaReportPdfGenerator.generateQuarterlyReportPDF()
IlpaReportPdfGenerator.generateCCDReportPDF()

         ↓

PDF Buffer → HTTP Response (Content-Type: application/pdf)
```

## Excel Generation (`src/services/ilpaReportExcelGenerator.js`)

Three report types with CSV fallback:

```javascript
// Performance report
async generatePerformanceReportExcel(metrics) {
  // Sheets: Fund Info, Performance Metrics, Capital Summary
}

// Quarterly report
async generateQuarterlyReportExcel(quarterlyData) {
  // Sheets: Quarterly Activity, Annual Summary
}

// CCD report
async generateCCDReportExcel(ccdData) {
  // Sheets: Capital Calls, Distributions, Summary
}
```

**CSV Fallback:** If ExcelJS fails or is unavailable, generators automatically fall back to CSV format with the same data structure.
