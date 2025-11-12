# Investment Manager - Complete Feature Map

Comprehensive mapping of all sections, pages, fields, and relationships in the investment manager platform.

---

## TABLE OF CONTENTS

1. [Navigation Structure](#1-navigation-structure)
2. [Structures Management](#2-structures-management)
3. [Investments Management](#3-investments-management)
4. [Investors Management](#4-investors-management)
5. [Operations - Capital Calls](#5-operations---capital-calls)
6. [Operations - Distributions](#6-operations---distributions)
7. [Capital Overview](#7-capital-overview)
8. [Reports](#8-reports)
9. [Waterfalls](#9-waterfalls)
10. [Additional Sections](#10-additional-sections)
11. [Data Relationships](#11-data-relationships)
12. [Workflow Patterns](#12-workflow-patterns)

---

## 1. NAVIGATION STRUCTURE

### Main Sidebar Navigation

```
Investment Manager Home (/investment-manager)
│
├─── PORTFOLIO
│    ├─ Dashboard (/)
│    ├─ Structures (/structures)
│    ├─ Investments (/investments)
│    └─ Investors (/investors)
│
├─── OPERATIONS
│    ├─ Capital Calls (/operations/capital-calls)
│    └─ Distributions (/operations/distributions)
│
├─── OVERVIEW
│    ├─ Capital Overview
│    │  ├─ Commitments (/capital-overview/commitments)
│    │  └─ Activity (/capital-overview/activity)
│    │
│    └─ Waterfalls (/waterfalls)
│
├─── REPORTING
│    ├─ Reports (/reports)
│    ├─ Documents (/documents)
│    └─ K-1 Forms (within reports)
│
├─── MANAGEMENT
│    ├─ Account (/account)
│    ├─ Settings (/settings)
│    ├─ Help (/help)
│    └─ Chat (/chat)
```

---

## 2. STRUCTURES MANAGEMENT

### 2.1 Structures List Page (`/investment-manager/structures`)

**Purpose:** View all fund/SPV/Trust structures with optional hierarchy display

**Features:**
```
┌─────────────────────────────────────────┐
│ STRUCTURES PAGE                         │
│                                         │
│ [Master Structures Grid/List]           │
│ ├─ View Toggle: Grid ⟷ List            │
│ ├─ Search bar                          │
│ ├─ Filter by Type:                      │
│ │  ├─ Fund                             │
│ │  ├─ SA/LLC                           │
│ │  ├─ Fideicomiso                      │
│ │  └─ Private Debt                     │
│ ├─ Filter by Status:                    │
│ │  ├─ Active                           │
│ │  ├─ Fundraising                      │
│ │  └─ Closed                           │
│ ├─ [+ Add Structure] button             │
│ │  └─ Redirects to /structure-setup    │
│ └─ Summary Metrics:                     │
│    ├─ Total Capital ($)                │
│    ├─ Total Structures                 │
│    ├─ Total Investors                  │
│    └─ Planned Investments              │
│                                         │
│ STRUCTURE CARDS (Grid View)             │
│ Each card shows:                        │
│ ├─ Structure name                      │
│ ├─ Location (jurisdiction)             │
│ ├─ Status badge                        │
│ ├─ Type & Subtype                      │
│ ├─ Total commitment ($)                │
│ ├─ Inception date                      │
│ ├─ Investor count                      │
│ ├─ Planned investments                 │
│ ├─ Current stage                       │
│ ├─ Hierarchy levels (if applicable)    │
│ └─ Action buttons:                      │
│    ├─ View details                     │
│    ├─ Edit                             │
│    └─ Delete (with cascade warning)    │
│                                         │
│ HIERARCHY TREE (List View)              │
│ Master Structure                        │
│ ├─ Level 2 (indented)                  │
│ │  ├─ Level 3 (indented)               │
│ │  │  └─ Level 4 (indented)            │
│ │  │     └─ Level 5 (indented)         │
│ └─ [Collapse/Expand] per node          │
└─────────────────────────────────────────┘
```

**Data Displayed:**
```typescript
// Per structure:
{
  id: string                    // Unique slug
  name: string                  // Fund/SPV name
  type: string                  // Fund, SA/LLC, Fideicomiso, Private Debt
  subtype: string               // e.g., "Multi-Project Fund"
  jurisdiction: string          // Geographic location
  status: string                // Active, Fundraising, Closed

  // Financial
  totalCommitment: number       // Total AUM ($)
  currency: string              // USD, EUR, MXN, etc.
  inceptionDate: Date           // Fund launch date

  // Metrics
  investors: number             // Count of LPs
  plannedInvestments: string    // Number or description
  currentStage: string          // Setup, Fundraising, Active, Closed

  // Hierarchy
  hierarchyLevel: number        // 1 (root), 2-5 (child levels)
  hierarchyLevels?: number      // Total levels in hierarchy
  childStructureCount?: number  // Number of children
}
```

---

### 2.2 Structure Detail Page (`/investment-manager/structures/[id]`)

**Purpose:** View complete structure details with all related data

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ STRUCTURE DETAIL                                    │
│                                                     │
│ [← Back] [Edit] [Delete] [More Options]            │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ STRUCTURE INFO                                  │ │
│ │                                                 │ │
│ │ Name: Polibit Real Estate II                   │ │
│ │ Type: Fund > Multi-Project Fund                │ │
│ │ Jurisdiction: United States (Delaware)         │ │
│ │ Status: Active                                  │ │
│ │ Inception Date: Jan 1, 2023                    │ │
│ │ Total Commitment: $50,000,000                  │ │
│ │ Currency: USD                                   │ │
│ │ Tax Rate: 21%                                   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ECONOMIC TERMS                                  │ │
│ │                                                 │ │
│ │ Management Fee: 2.0%                           │ │
│ │ Performance Fee (Carry): 20%                   │ │
│ │ Hurdle Rate: 8%                                │ │
│ │ Preferred Return: 7%                           │ │
│ │ Waterfall Type: American                       │ │
│ │ Distribution Frequency: Annual                 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌──────────────────┬──────────────────────────────┐ │
│ │ KEY METRICS      │ CAPACITY                     │ │
│ │                  │                              │ │
│ │ Total Capital:   │ Investors: 15 / 25 (Growth) │ │
│ │ $50,000,000      │ Investments: 8 / 15         │ │
│ │                  │ Issuances: 12 / 25          │ │
│ │ Total Invested:  │ Tier: Growth                │ │
│ │ $35,000,000      │                              │ │
│ │                  │                              │ │
│ │ Current Value:   │                              │ │
│ │ $38,000,000      │                              │ │
│ │                  │                              │ │
│ │ Unrealized Gain: │                              │ │
│ │ +$3,000,000      │                              │ │
│ │                  │                              │ │
│ │ Called Capital:  │                              │ │
│ │ $32,000,000      │                              │ │
│ │                  │                              │ │
│ │ Uncalled:        │                              │ │
│ │ $18,000,000      │                              │ │
│ │                  │                              │ │
│ │ Deployment Rate: │                              │ │
│ │ 64%              │                              │ │
│ └──────────────────┴──────────────────────────────┘ │
│                                                     │
│ TABS:                                               │
│ │ Overview │ Investors │ Investments │ Documents   │
│ │          │           │              │ Waterfall  │
│ │                                                  │
│ │ INVESTORS TAB                                    │
│ │ ├─ Total Investors: 15                          │
│ │ ├─ List of all LPs with:                        │
│ │ │  ├─ Name                                     │
│ │ │  ├─ Type (Individual/Institution/FOF)        │
│ │ │  ├─ Commitment amount                        │
│ │ │  ├─ Called capital                           │
│ │ │  ├─ Uncalled capital                         │
│ │ │  ├─ Current value                            │
│ │ │  └─ Status                                   │
│ │ └─ [+ Add Investor] button                      │
│ │                                                  │
│ │ INVESTMENTS TAB                                  │
│ │ ├─ Total Investments: 8                         │
│ │ ├─ List of all portfolio items with:            │
│ │ │  ├─ Name                                     │
│ │ │  ├─ Asset type                               │
│ │ │  ├─ Location                                 │
│ │ │  ├─ Investment type (Equity/Debt/Mixed)      │
│ │ │  ├─ Acquisition price                        │
│ │ │  ├─ Current value                            │
│ │ │  ├─ IRR                                      │
│ │ │  └─ Multiple (MOIC)                          │
│ │ └─ [+ Add Investment] button                    │
│ │                                                  │
│ │ DOCUMENTS TAB                                   │
│ │ ├─ Fund Documents:                              │
│ │ │  ├─ PPM (Private Placement Memo)             │
│ │ │  ├─ LPA (Limited Partnership Agreement)      │
│ │ │  ├─ Subscription Agreement                   │
│ │ │  ├─ Operating Agreement                      │
│ │ │  └─ [Download] buttons                       │
│ │ └─ [+ Upload Document] button                   │
│ │                                                  │
│ │ WATERFALL TAB                                   │
│ │ ├─ Waterfall Type: American                     │
│ │ ├─ Tier 1: Return of Capital (100% LP)         │
│ │ ├─ Tier 2: Preferred Return (100% LP, 8%)      │
│ │ ├─ Tier 3: GP Catch-Up (until 20% carry)       │
│ │ ├─ Tier 4: Carried Interest (20% GP, 80% LP)   │
│ │ └─ [View Full Waterfall] button                 │
│ │                                                  │
│ │ CHILD STRUCTURES (if hierarchy)                 │
│ │ ├─ Level 2: Polibit Real Estate II - L2        │
│ │ │  ├─ Status: Active                           │
│ │ │  ├─ Commitment: $40M                         │
│ │ │  ├─ Waterfall: Yes, Economic Terms: Yes      │
│ │ │  └─ [View] [Edit]                            │
│ │ ├─ Level 3: Polibit Real Estate II - L3        │
│ │ └─ Level 4: Polibit Real Estate II - L4        │
└─────────────────────────────────────────────────────┘
```

---

### 2.3 Structure Edit Page (`/investment-manager/structures/[id]/edit`)

**Purpose:** Modify structure details and hierarchy

**Form Fields:**
```
┌─────────────────────────────────────────┐
│ EDIT STRUCTURE                          │
│                                         │
│ SECTION 1: BASIC INFO                  │
│ ├─ Structure Name (text input)         │
│ ├─ Type (dropdown, disabled)            │
│ ├─ Subtype (dropdown, disabled)         │
│ ├─ Jurisdiction (dropdown)              │
│ ├─ US State (if US selected)            │
│ ├─ Inception Date (date picker)        │
│ ├─ Status (dropdown):                   │
│ │  ├─ Active                           │
│ │  ├─ Fundraising                      │
│ │  └─ Closed                           │
│ └─ Currency (dropdown)                  │
│                                         │
│ SECTION 2: ECONOMIC TERMS               │
│ ├─ Management Fee % (number input)      │
│ ├─ Performance Fee % (number input)     │
│ ├─ Hurdle Rate % (number input)         │
│ ├─ Preferred Return % (number input)    │
│ ├─ Waterfall Type (radio):              │
│ │  ├─ American                         │
│ │  └─ European                         │
│ └─ Distribution Frequency (dropdown)    │
│                                         │
│ SECTION 3: CAPACITY                     │
│ ├─ Total Commitment (number input)      │
│ ├─ Calculated Issuances (read-only)     │
│ ├─ Planned Investments (number input)   │
│ └─ Pricing Tier (read-only):            │
│    └─ Starter / Growth / Enterprise     │
│                                         │
│ SECTION 4: HIERARCHY (if multi-level)   │
│ ├─ Hierarchy Level (read-only): 1       │
│ ├─ Number of Levels (read-only): 4      │
│ ├─ Parent Structure (read-only): None   │
│ ├─ Child Structures (list):              │
│ │  ├─ L2: Polibit Real Estate II - L2   │
│ │  ├─ L3: Polibit Real Estate II - L3   │
│ │  └─ L4: Polibit Real Estate II - L4   │
│ │                                       │
│ │ Edit Level-Specific Settings:         │
│ │ ├─ Apply Waterfall: [Toggle]          │
│ │ ├─ Apply Economic Terms: [Toggle]     │
│ │ ├─ Waterfall Algorithm: American/Eur  │
│ │ └─ Income Flow Target: Parent/Invest  │
│ │                                       │
│ └─ [Save Hierarchy Changes]             │
│                                         │
│ [Save Changes] [Cancel]                 │
└─────────────────────────────────────────┘
```

---

### 2.4 Child Structure Detail/Edit

**Path:** `/investment-manager/structures/[id]/[childSlug]`
**Path:** `/investment-manager/structures/[id]/[childSlug]/edit`

**Same structure as parent detail/edit pages**

Additional field:
- Parent breadcrumb: "Polibit Real Estate II > Level 2"
- Can delete child independently

---

## 3. INVESTMENTS MANAGEMENT

### 3.1 Investments List Page (`/investment-manager/investments`)

**Purpose:** View and manage all investments across all structures

**Features:**
```
┌─────────────────────────────────────────────────────┐
│ INVESTMENTS PAGE                                    │
│                                                     │
│ [Search] [Filter] [+ Add Investment]               │
│                                                     │
│ FILTERS:                                            │
│ ├─ Structure: [Dropdown] - All                     │
│ ├─ Asset Type: [Dropdown] - All                    │
│ │  ├─ Office                                      │
│ │  ├─ Retail                                      │
│ │  ├─ Industrial                                  │
│ │  ├─ Residential                                 │
│ │  ├─ Mixed-Use                                   │
│ │  ├─ Land                                        │
│ │  ├─ Software                                    │
│ │  ├─ Healthcare                                  │
│ │  └─ Other                                       │
│ │                                                 │
│ ├─ Investment Type: [Dropdown]                     │
│ │  ├─ Equity                                     │
│ │  ├─ Debt                                       │
│ │  └─ Mixed                                      │
│ │                                                 │
│ ├─ Status: [Dropdown]                             │
│ │  ├─ Active                                     │
│ │  ├─ Under Construction                         │
│ │  ├─ Stabilized                                 │
│ │  └─ Exited                                     │
│ │                                                 │
│ └─ Geography: [Dropdown] - All                     │
│                                                     │
│ INVESTMENTS TABLE:                                  │
│ ┌────────────────────────────────────────────────┐ │
│ │ Name | Type | Asset | Location | Status | ... │ │
│ ├────────────────────────────────────────────────┤ │
│ │ Riverfront Plaza | MIXED | Office | NYC, NY   │ │
│ │ | Active | [View] [Edit] [Delete]             │ │
│ │                                                │ │
│ │ Sunset Apartments | EQUITY | Residential      │ │
│ │ | LA, CA | Stabilized | [View] [Edit] [Dlt]  │ │
│ │                                                │ │
│ │ Tech Park Debt | DEBT | Office | SF, CA       │ │
│ │ | Active | [View] [Edit] [Delete]             │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
│ [Pagination] - Page 1 of 2                         │
└─────────────────────────────────────────────────────┘
```

**Columns in Table:**
```typescript
{
  name: string                  // Investment name
  type: string                  // Real Estate, PE, Debt
  investmentType: string        // EQUITY, DEBT, MIXED
  assetType: string             // Office, Retail, etc.
  location: string              // City, State/Country
  sector: string                // Real Estate, PE, etc.
  status: string                // Active, Stabilized, Exited
  acquisitionDate: Date         // Purchase date
  acquisitionPrice: number      // Original cost
  currentValue: number          // Current valuation
  unrealizedGain: number        // Gain/(Loss)
  irr: number                   // IRR %
  multiple: number              // MOIC (Multiple of Invested Capital)
  ownershipPercent: number      // Fund ownership (equity only)
  fundCommitment: number        // Fund's total commitment
}
```

---

### 3.2 Investment Detail Page (`/investment-manager/investments/[id]`)

**Purpose:** View complete investment details and positions

**Layout:**
```
┌────────────────────────────────────────────────────┐
│ INVESTMENT DETAIL                                  │
│                                                    │
│ [← Back] [Edit] [Delete] [More Options]           │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ BASIC INFO                                   │  │
│ │                                              │  │
│ │ Name: Riverfront Plaza                      │  │
│ │ Type: Real Estate                           │  │
│ │ Investment Type: MIXED (Equity + Debt)      │  │
│ │ Asset Type: Office                          │  │
│ │ Sector: Commercial Real Estate              │  │
│ │ Status: Active                              │  │
│ │                                              │  │
│ │ Location:                                    │  │
│ │ ├─ City: New York                           │  │
│ │ ├─ State: New York                          │  │
│ │ ├─ Country: United States                   │  │
│ │ └─ Zip: 10001                               │  │
│ │                                              │  │
│ │ Acquisition Date: Jan 15, 2022              │  │
│ │ Last Valuation: Oct 31, 2024                │  │
│ │ Structure: Polibit Real Estate II           │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ ┌───────────────────┬──────────────────────────┐  │
│ │ EQUITY POSITION   │ DEBT POSITION            │  │
│ │                   │                          │  │
│ │ Status: Active    │ Status: Active           │  │
│ │                   │                          │  │
│ │ Equity Invested:  │ Principal Provided:      │  │
│ │ $15,000,000       │ $10,000,000              │  │
│ │                   │                          │  │
│ │ Current Value:    │ Current Value:           │  │
│ │ $16,500,000       │ $10,250,000              │  │
│ │                   │                          │  │
│ │ Unrealized Gain:  │ Interest Rate: 5%        │  │
│ │ +$1,500,000       │                          │  │
│ │                   │ Origination Date:        │  │
│ │ Ownership %:      │ Jan 15, 2022             │  │
│ │ 40%               │                          │  │
│ │                   │ Maturity Date:           │  │
│ │ IRR: 12.5%        │ Jan 15, 2027             │  │
│ │                   │                          │  │
│ │ MOIC: 1.10x       │ Accrued Interest:        │  │
│ │                   │ $250,000                 │  │
│ └───────────────────┴──────────────────────────┘  │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ TOTAL FUND POSITION                          │  │
│ │                                              │  │
│ │ Total Fund Investment: $25,000,000           │  │
│ │ (Equity $15M + Debt $10M)                    │  │
│ │                                              │  │
│ │ Current Value: $26,750,000                   │  │
│ │ Unrealized Gain: +$1,750,000                 │  │
│ │                                              │  │
│ │ IRR: 12.5%                                   │  │
│ │ Multiple (MOIC): 1.07x                       │  │
│ │                                              │  │
│ │ Fund Commitment: $25,000,000 (40% of total) │  │
│ │ Ownership: 40% (from equity only)            │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ TABS: Overview | Documents | Valuations          │
│                                                    │
│ DOCUMENTS TAB:                                     │
│ ├─ Acquisition Agreement                         │  │
│ ├─ Appraisal Report                              │  │
│ ├─ Loan Documents                                │  │
│ └─ [+ Upload Document]                           │  │
│                                                    │
│ VALUATIONS TAB:                                    │
│ ├─ Valuation History:                             │  │
│ │  ├─ Oct 31, 2024: $26,750,000                  │  │
│ │  ├─ Jul 31, 2024: $26,500,000                  │  │
│ │  ├─ Apr 30, 2024: $26,250,000                  │  │
│ │  └─ [+ Add Valuation]                          │  │
│ │                                                 │  │
│ │ Valuation Chart (Recharts line graph)          │  │
│ └─ [Export Valuation History]                    │  │
└────────────────────────────────────────────────────┘
```

---

### 3.3 Investment Add/Edit Page (`/investment-manager/investments/add`, `/investments/[id]/edit`)

**Purpose:** Create or modify an investment

**Form Fields:**
```
┌──────────────────────────────────────────────────┐
│ ADD / EDIT INVESTMENT                            │
│                                                  │
│ SECTION 1: BASIC INFORMATION                    │
│ ├─ Investment Name (text input, required)       │
│ ├─ Structure (dropdown, required)               │
│ │  └─ [List of all structures]                  │
│ │                                               │
│ ├─ Asset Type (dropdown):                       │
│ │  ├─ Office                                   │
│ │  ├─ Retail                                   │
│ │  ├─ Industrial                               │
│ │  ├─ Residential                              │
│ │  ├─ Mixed-Use                                │
│ │  ├─ Land                                     │
│ │  ├─ Software                                 │
│ │  ├─ Healthcare                               │
│ │  └─ Other (text input)                       │
│ │                                               │
│ ├─ Sector (dropdown):                           │
│ │  ├─ Real Estate                              │
│ │  ├─ Private Equity                           │
│ │  ├─ Private Debt                             │
│ │  ├─ Infrastructure                           │
│ │  ├─ Technology                               │
│ │  └─ Other (text input)                       │
│ │                                               │
│ ├─ Status (dropdown):                           │
│ │  ├─ Active                                   │
│ │  ├─ Under Construction                       │
│ │  ├─ Stabilized                               │
│ │  └─ Exited                                   │
│ │                                               │
│ └─ Description (textarea, optional)             │
│                                                  │
│ SECTION 2: LOCATION                             │
│ │ (Jurisdiction-aware parsing)                  │
│ │                                               │
│ ├─ City (text input, required)                  │
│ ├─ State (text input, if US)                    │
│ │  └─ [Dropdown: CA, NY, TX, etc. for US]      │
│ ├─ Country (dropdown, required)                 │
│ │  └─ [Countries based on structures]           │
│ └─ Zip Code (text input, optional)              │
│                                                  │
│ SECTION 3: INVESTMENT TYPE                      │
│ │                                               │
│ ├─ Investment Type (radio, required):           │
│ │  ├─ ◉ EQUITY ONLY                            │
│ │  ├─ ◉ DEBT ONLY                              │
│ │  └─ ◉ MIXED (Equity + Debt)                  │
│ │                                               │
│ └─ IF MIXED: Show both Equity & Debt forms     │
│                                                  │
│ SECTION 4A: EQUITY POSITION (if selected)       │
│ │                                               │
│ ├─ Acquisition Date (date picker, required)    │
│ ├─ Acquisition Price (number input, required)  │
│ ├─ Equity Invested (number input, required)    │
│ │  └─ Note: This determines ownership %        │
│ │                                               │
│ ├─ Current Value (number input, required)      │
│ │  └─ Auto-calculates: Unrealized = CV - AP    │
│ │                                               │
│ ├─ Fund Commitment (read-only, from struct)    │
│ ├─ Ownership % (auto-calculated):              │
│ │  └─ Formula: Equity Invested / Fund Comm * 100
│ │                                               │
│ └─ Show Calculated Ownership Percentage        │
│                                                  │
│ SECTION 4B: DEBT POSITION (if selected)         │
│ │                                               │
│ ├─ Principal Provided (number input)           │
│ ├─ Interest Rate % (number input)              │
│ ├─ Origination Date (date picker)              │
│ ├─ Maturity Date (date picker)                 │
│ ├─ Current Debt Value (number input)           │
│ └─ Accrued Interest (auto-calculated)          │
│                                                  │
│ SECTION 5: PERFORMANCE (optional, auto-calc)    │
│ │                                               │
│ ├─ IRR % (auto-calculated or manual override)  │
│ ├─ Multiple / MOIC (auto-calculated)           │
│ └─ Last Valuation Date (date picker)           │
│                                                  │
│ [Save Investment] [Cancel]                      │
│                                                  │
│ VALIDATION RULES:                               │
│ ├─ Check investment capacity not exceeded      │
│ ├─ Check issuance count:                        │
│ │  ├─ EQUITY = 1 issuance                      │
│ │  ├─ DEBT = 1 issuance                        │
│ │  └─ MIXED = 2 issuances                      │
│ ├─ Validate against tier limits                 │
│ └─ Warn if exceeds structure capacity          │
└──────────────────────────────────────────────────┘

CRITICAL RULE:
Ownership % is calculated from EQUITY INVESTED ONLY,
never from total fund commitment or debt amount
```

---

## 4. INVESTORS MANAGEMENT

### 4.1 Investors List Page (`/investment-manager/investors`)

**Purpose:** View and manage all Limited Partners across structures

**Features:**
```
┌──────────────────────────────────────────────────┐
│ INVESTORS PAGE                                   │
│                                                  │
│ [Search] [Filter] [+ Add Investor]              │
│                                                  │
│ FILTERS:                                         │
│ ├─ Structure: [Dropdown] - All                  │
│ ├─ Type: [Dropdown] - All                       │
│ │  ├─ Individual                               │
│ │  ├─ Institution                              │
│ │  ├─ Fund of Funds                            │
│ │  └─ Family Office                            │
│ │                                               │
│ └─ Status: [Dropdown] - All                     │
│    ├─ Pending                                  │
│    ├─ KYC/KYB                                  │
│    ├─ Contracts                                │
│    ├─ Payments                                 │
│    ├─ Active                                   │
│    └─ Inactive                                 │
│                                                  │
│ INVESTORS TABLE:                                 │
│ ┌────────────────────────────────────────────┐ │
│ │ Name | Type | Email | Status | Funds | ... │ │
│ ├────────────────────────────────────────────┤ │
│ │ John Smith | Individual | john@... | Active  │ │
│ │ | 2 Funds | Commitment: $5M | [View] [Edit] │ │
│ │                                              │ │
│ │ Acme Capital Partners | Institution         │ │
│ │ | contact@acme... | Active | 3 Funds       │ │
│ │ | Commitment: $15M | [View] [Edit] [Dlt]   │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
│ [Pagination] - Page 1 of 1                      │
└──────────────────────────────────────────────────┘
```

**Columns:**
```typescript
{
  name: string                  // First + Last or Entity Name
  email: string                 // Email address
  type: string                  // Individual, Institution, FOF, Family Office
  status: string                // Pending, KYC, Contracts, Active, Inactive
  fundCount: number             // Number of structures invested in
  totalCommitment: number       // Total across all structures
  calledCapital: number         // Total called
  currentValue: number          // Total current value
  irr: number                   // Weighted IRR
}
```

---

### 4.2 Investor Detail Page (`/investment-manager/investors/[id]`)

**Purpose:** View complete investor profile and allocations

**Layout:**
```
┌────────────────────────────────────────────────────┐
│ INVESTOR PROFILE                                   │
│                                                    │
│ [← Back] [Edit] [Delete] [More Options]           │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ INVESTOR INFO                                │  │
│ │                                              │  │
│ │ Name: John Smith (or entity name)            │  │
│ │ Email: john@email.com                        │  │
│ │ Phone: +1 (555) 123-4567                     │  │
│ │ Type: Individual                             │  │
│ │ Status: Active                               │  │
│ │ Investor Since: Jan 1, 2022                  │  │
│ │                                              │  │
│ │ Tax ID: [Redacted]                           │  │
│ │ Address: New York, NY, USA                   │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ ┌────────────────┬──────────────────────────────┐ │
│ │ PORTFOLIO      │ K-1 STATUS                   │ │
│ │                │                              │ │
│ │ Total Comm:    │ Status: In Progress          │ │
│ │ $7,000,000     │ Delivery Date: TBD           │ │
│ │                │ [View K-1 Details]           │ │
│ │ Called Cap:    │                              │ │
│ │ $4,500,000     │                              │ │
│ │                │                              │ │
│ │ Uncalled:      │                              │ │
│ │ $2,500,000     │                              │ │
│ │                │                              │ │
│ │ Deployment: 64%│                              │ │
│ │                │                              │ │
│ │ Current Value: │                              │ │
│ │ $5,250,000     │                              │ │
│ │                │                              │ │
│ │ Unrealized:    │                              │ │
│ │ +$750,000      │                              │ │
│ │                │                              │ │
│ │ Distributed:   │                              │ │
│ │ $500,000       │                              │ │
│ │                │                              │ │
│ │ Total Return:  │                              │ │
│ │ +$1,250,000    │                              │ │
│ │                │                              │ │
│ │ Weighted IRR:  │                              │ │
│ │ 9.5%           │                              │ │
│ └────────────────┴──────────────────────────────┘ │
│                                                    │
│ TABS: Overview | Fund Allocations | Documents     │
│                                                    │
│ FUND ALLOCATIONS TAB:                              │
│ ├─ Polibit Real Estate II                         │
│ │  ├─ Commitment: $5,000,000                     │
│ │  ├─ Called Capital: $3,200,000                 │
│ │  ├─ Uncalled: $1,800,000                       │
│ │  ├─ Current Value: $3,800,000                  │
│ │  ├─ Ownership: 10%                             │
│ │  ├─ IRR: 9.5%                                  │
│ │  ├─ Custom Terms:                              │
│ │  │  ├─ Mgmt Fee: 2.0% (same as fund)          │
│ │  │  ├─ Performance Fee: 20% (same)             │
│ │  │  └─ [Edit Custom Terms]                    │
│ │  └─ [View] [Edit]                              │
│ │                                                 │
│ └─ Metropolitan Real Estate SPV                   │
│    ├─ Commitment: $2,000,000                     │
│    ├─ Called Capital: $1,300,000                 │
│    ├─ [View] [Edit]                              │
│                                                    │
│ DOCUMENTS TAB:                                     │
│ ├─ W-9 Form                                       │
│ ├─ K-1 History (2023, 2022, 2021)                │
│ ├─ Historical Tax Returns                         │
│ └─ [+ Upload Document]                           │
└────────────────────────────────────────────────────┘
```

---

### 4.3 Investor Add/Edit Page (`/investment-manager/investors/add`, `/investors/[id]/edit`)

**Purpose:** Create or modify investor record

**Form Fields:**
```
┌──────────────────────────────────────────────────┐
│ ADD / EDIT INVESTOR                              │
│                                                  │
│ SECTION 1: INVESTOR TYPE & BASIC INFO            │
│ │                                               │
│ ├─ Investor Type (radio, required):              │
│ │  ├─ ◉ Individual                              │
│ │  ├─ ◉ Institution                             │
│ │  ├─ ◉ Fund of Funds                           │
│ │  └─ ◉ Family Office                           │
│ │                                               │
│ └─ CONDITIONAL FIELDS (based on type):           │
│                                                  │
│    IF INDIVIDUAL:                                │
│    ├─ First Name (text input, required)         │
│    ├─ Last Name (text input, required)          │
│    └─ Tax ID (text input, optional)             │
│                                                  │
│    IF INSTITUTION:                               │
│    ├─ Entity Name (text input, required)        │
│    ├─ Entity Type (dropdown):                    │
│    │  ├─ LLC                                    │
│    │  ├─ Corporation                            │
│    │  ├─ Partnership                            │
│    │  ├─ Trust                                  │
│    │  └─ Other (text input)                     │
│    ├─ Contact First Name (text input)           │
│    ├─ Contact Last Name (text input)            │
│    └─ Tax ID (text input, optional)             │
│                                                  │
│    IF FUND OF FUNDS:                             │
│    ├─ Fund Name (text input, required)          │
│    ├─ GP Name (text input)                      │
│    ├─ Contact Name (text input)                 │
│    └─ Tax ID (text input, optional)             │
│                                                  │
│    IF FAMILY OFFICE:                             │
│    ├─ Office Name (text input, required)        │
│    ├─ Family Name (text input)                  │
│    ├─ Contact Name (text input)                 │
│    └─ Tax ID (text input, optional)             │
│                                                  │
│ SECTION 2: CONTACT INFORMATION                  │
│ ├─ Email (email input, required, unique)        │
│ ├─ Phone (tel input, optional)                  │
│ ├─ Address (text input, optional)               │
│ └─ Country (dropdown, optional)                 │
│                                                  │
│ SECTION 3: FUND ALLOCATIONS                     │
│ │                                               │
│ ├─ Add Fund Allocation:                          │
│ │  ├─ Select Structure (dropdown, required)     │
│ │  │  └─ [List of all structures]               │
│ │  │                                             │
│ │  ├─ Hierarchy Level (if applicable):          │
│ │  │  └─ [Show investable levels only]          │
│ │  │                                             │
│ │  ├─ Commitment Amount (number input, req)     │
│ │  │                                             │
│ │  ├─ Custom Economic Terms (optional):         │
│ │  │  ├─ Override Fund Mgmt Fee: [checkbox]     │
│ │  │  │  └─ Mgmt Fee %: [input]                 │
│ │  │  ├─ Override Perf Fee: [checkbox]          │
│ │  │  │  └─ Perf Fee %: [input]                 │
│ │  │  ├─ Override Hurdle: [checkbox]            │
│ │  │  │  └─ Hurdle %: [input]                   │
│ │  │  └─ Override Preferred Return: [checkbox]  │
│ │  │     └─ Preferred %: [input]                │
│ │  │                                             │
│ │  └─ [+ Add This Allocation] [Remove]          │
│ │                                               │
│ │ Current Allocations:                          │
│ │ ├─ Polibit Real Estate II - $5,000,000        │
│ │ │  └─ Custom Terms: No                        │
│ │ │     [Edit] [Remove]                         │
│ │ │                                             │
│ │ └─ Metropolitan SPV - $2,000,000              │
│ │    └─ Custom Terms: Yes (Mgmt Fee: 1.5%)     │
│ │       [Edit] [Remove]                         │
│                                                  │
│ SECTION 4: STATUS & METADATA                    │
│ ├─ Status (dropdown):                           │
│ │  ├─ Pending                                  │
│ │  ├─ KYC/KYB                                  │
│ │  ├─ Contracts                                │
│ │  ├─ Payments                                 │
│ │  ├─ Active                                   │
│ │  └─ Inactive                                 │
│ │                                               │
│ └─ Investor Since (date picker, auto-filled)   │
│                                                  │
│ [Save Investor] [Cancel]                        │
└──────────────────────────────────────────────────┘
```

---

## 5. OPERATIONS - CAPITAL CALLS

### 5.1 Capital Calls List Page (`/investment-manager/operations/capital-calls`)

**Purpose:** Track and manage capital calls across all structures

**Features:**
```
┌──────────────────────────────────────────────────┐
│ CAPITAL CALLS PAGE                               │
│                                                  │
│ [Search] [Filter] [+ Create Capital Call]       │
│                                                  │
│ FILTERS:                                         │
│ ├─ Structure: [Dropdown] - All                  │
│ ├─ Status: [Dropdown] - All                     │
│ │  ├─ Draft                                    │
│ │  ├─ Sent                                     │
│ │  ├─ Partially Paid                           │
│ │  ├─ Fully Paid                               │
│ │  ├─ Overdue                                  │
│ │  └─ Cancelled                                │
│ │                                               │
│ └─ Date Range: [Start Date] - [End Date]       │
│                                                  │
│ CAPITAL CALLS TABLE:                             │
│ ┌────────────────────────────────────────────┐ │
│ │ Call# | Fund | Amount | Due Date | Status  │ │
│ ├────────────────────────────────────────────┤ │
│ │ CC-001 | Polibit Real Estate II             │ │
│ │ | $5,000,000 | Dec 15, 2024 | Sent         │ │
│ │ | $4,500,000 Paid | $500,000 Outstanding   │ │
│ │ | [View] [Edit] [Resend] [Delete]          │ │
│ │                                              │ │
│ │ CC-002 | Metropolitan SPV                   │ │
│ │ | $2,000,000 | Jan 15, 2025 | Draft        │ │
│ │ | $0 Paid | $2,000,000 Outstanding         │ │
│ │ | [View] [Edit] [Send] [Delete]            │ │
│ │                                              │ │
│ │ CC-003 | Caribbean Debt Fund II             │ │
│ │ | $3,500,000 | Nov 30, 2024 | Overdue      │ │
│ │ | $1,200,000 Paid | $2,300,000 Outstanding │ │
│ │ | [View] [Edit] [Send Reminder] [Delete]   │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
│ SUMMARY METRICS:                                 │
│ ├─ Total Amount Called: $10,500,000            │
│ ├─ Total Amount Paid: $5,700,000               │
│ ├─ Total Outstanding: $4,800,000               │
│ └─ Overall Collection Rate: 54%                │
│                                                  │
│ [Pagination] - Page 1 of 2                      │
└──────────────────────────────────────────────────┘
```

---

### 5.2 Capital Call Detail Page (`/investment-manager/operations/capital-calls/[id]`)

**Purpose:** View capital call details and investor payment status

**Layout:**
```
┌────────────────────────────────────────────────────┐
│ CAPITAL CALL DETAIL                                │
│                                                    │
│ [← Back] [Edit] [Send] [Delete]                   │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ CAPITAL CALL INFO                            │  │
│ │                                              │  │
│ │ Call Number: CC-001                          │  │
│ │ Status: Sent                                 │  │
│ │                                              │  │
│ │ Fund: Polibit Real Estate II                 │  │
│ │ Total Call Amount: $5,000,000                │  │
│ │ Call Date: Dec 1, 2024                       │  │
│ │ Due Date: Dec 15, 2024                       │  │
│ │ Notice Period: 15 days                       │  │
│ │                                              │  │
│ │ Purpose: Acquisition - Riverfront Plaza      │  │
│ │ Use of Proceeds: Real estate acquisition     │  │
│ │                                              │  │
│ │ Management Fee Included: No                  │  │
│ │ Sent Date: Dec 2, 2024                       │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ SUMMARY                                      │  │
│ │                                              │  │
│ │ Total Called: $5,000,000                     │  │
│ │ Total Paid: $4,500,000 (90%)                 │  │
│ │ Total Outstanding: $500,000 (10%)            │  │
│ │                                              │  │
│ │ Status: Mostly Paid, 1 Investor Pending      │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ INVESTOR ALLOCATIONS TABLE:                        │
│ ┌────────────────────────────────────────────┐   │
│ │ Investor | Ownership | Allocation | Paid   │   │
│ │ | Status | Payment Date | [Actions]        │   │
│ ├────────────────────────────────────────────┤   │
│ │ John Smith | 10% | $500,000 | $500,000     │   │
│ │ | Paid | Dec 10, 2024 | [View Receipt]     │   │
│ │                                             │   │
│ │ Acme Capital Partners | 40% | $2,000,000   │   │
│ │ | $2,000,000 | Paid | Dec 8, 2024          │   │
│ │ | [View Receipt]                           │   │
│ │                                             │   │
│ │ Smith Family Office | 50% | $2,500,000     │   │
│ │ | $2,000,000 | Partial | Dec 12, 2024      │   │
│ │ | Outstanding: $500,000                    │   │
│ │ | [Send Payment Reminder] [Record Payment] │   │
│ └────────────────────────────────────────────┘   │
│                                                    │
│ [Edit Capital Call] [Send to All] [Delete]       │
└────────────────────────────────────────────────────┘
```

---

### 5.3 Create Capital Call Page (`/investment-manager/operations/capital-calls/create`)

**Purpose:** Create and send a new capital call

**Form Fields:**
```
┌──────────────────────────────────────────────────┐
│ CREATE CAPITAL CALL                              │
│                                                  │
│ SECTION 1: BASIC INFORMATION                    │
│ ├─ Structure (dropdown, required)               │
│ │  └─ [List of all structures]                  │
│ │                                               │
│ ├─ Total Call Amount (currency input, req)      │
│ ├─ Currency (dropdown)                          │
│ │  └─ USD, EUR, MXN, etc.                       │
│ │                                               │
│ ├─ Call Date (date picker, required)            │
│ │  └─ Today's date                              │
│ │                                               │
│ ├─ Due Date (date picker, required)             │
│ │  └─ Calculated from notice period             │
│ │                                               │
│ └─ Notice Period Days (number input, required)  │
│    └─ Usually 10-30 days (ILPA standard: 15)   │
│                                                  │
│ SECTION 2: PURPOSE & DETAILS                    │
│ ├─ Purpose (text input, required)               │
│ │  └─ e.g., "Acquisition - Riverfront Plaza"   │
│ │                                               │
│ ├─ Related Investment (dropdown, optional)      │
│ │  └─ [List of investments in this structure]  │
│ │                                               │
│ ├─ Use of Proceeds (textarea, optional)         │
│ │  └─ Detailed description                      │
│ │                                               │
│ ├─ Management Fee Included (toggle, optional)   │
│ │  ├─ If yes, show Management Fee Amount       │
│ │  └─ Auto-calculated from structure settings  │
│ │                                               │
│ └─ Description / Notes (textarea, optional)     │
│                                                  │
│ SECTION 3: INVESTOR ALLOCATIONS                 │
│ │                                               │
│ ├─ Auto-calculate based on ownership:           │
│ │  └─ [Show all investors with their ownership] │
│ │                                               │
│ ├─ Investor Allocations Table:                   │
│ │  ┌───────────────────────────────────────┐   │
│ │  │ Investor | Ownership | Call Amount    │   │
│ │  ├───────────────────────────────────────┤   │
│ │  │ John Smith | 10% | $500,000           │   │
│ │  │ [+ Override Amount]                   │   │
│ │  │                                        │   │
│ │  │ Acme Capital | 40% | $2,000,000       │   │
│ │  │ [Override] [Remove]                   │   │
│ │  │                                        │   │
│ │  │ Smith Family | 50% | $2,500,000       │   │
│ │  │ [Override] [Remove]                   │   │
│ │  └───────────────────────────────────────┘   │
│ │                                               │
│ └─ Verify Total = Call Amount                   │
│                                                  │
│ SECTION 4: STATUS & SENDING                     │
│ ├─ Initial Status (dropdown):                   │
│ │  ├─ Draft (default)                         │
│ │  └─ Sent (immediately mark as sent)         │
│ │                                               │
│ └─ If Status = "Sent":                          │
│    ├─ Sent Date (auto-filled: today)           │
│    ├─ [Notify Investors Now] toggle            │
│    └─ [Email Template] dropdown:                │
│       ├─ Standard ILPA Template                │
│       ├─ Custom Template                       │
│       └─ Plain Text                            │
│                                                  │
│ [Save as Draft] [Send Capital Call]             │
└──────────────────────────────────────────────────┘
```

---

## 6. OPERATIONS - DISTRIBUTIONS

### 6.1 Distributions List Page (`/investment-manager/operations/distributions`)

**Purpose:** Track and manage investor distributions

**Features:**
```
┌──────────────────────────────────────────────────┐
│ DISTRIBUTIONS PAGE                               │
│                                                  │
│ [Search] [Filter] [+ Create Distribution]       │
│                                                  │
│ FILTERS:                                         │
│ ├─ Structure: [Dropdown] - All                  │
│ ├─ Status: [Dropdown] - All                     │
│ │  ├─ Pending                                  │
│ │  ├─ Processing                               │
│ │  ├─ Completed                                │
│ │  └─ Failed                                   │
│ │                                               │
│ └─ Distribution Type: [Dropdown] - All          │
│    ├─ Operating Income                         │
│    ├─ Exit Proceeds                            │
│    ├─ Preferred Return                         │
│    ├─ Carried Interest                         │
│    └─ Other                                    │
│                                                  │
│ DISTRIBUTIONS TABLE:                             │
│ ┌────────────────────────────────────────────┐ │
│ │ Dist# | Fund | Amount | Date | Status | .. │ │
│ ├────────────────────────────────────────────┤ │
│ │ D-001 | Polibit Real Estate II              │ │
│ │ | $2,000,000 | Oct 31, 2024 | Completed    │ │
│ │ | Income: $1,000,000 | Return: $1,000,000  │ │
│ │ | [View] [Edit] [Resend Statement]          │ │
│ │                                              │ │
│ │ D-002 | Metropolitan SPV                    │ │
│ │ | $500,000 | Nov 15, 2024 | Processing     │ │
│ │ | Operating Income: $500,000                │ │
│ │ | [View] [Mark Complete] [Delete]           │ │
│ │                                              │ │
│ │ D-003 | Caribbean Debt Fund II              │ │
│ │ | $750,000 | Dec 1, 2024 | Pending         │ │
│ │ | Interest Income: $750,000                 │ │
│ │ | [View] [Edit] [Process] [Delete]          │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
│ SUMMARY METRICS:                                 │
│ ├─ Total Distributions: $15,250,000            │
│ ├─ Completed: $12,000,000                      │
│ ├─ Processing: $2,000,000                      │
│ ├─ Pending: $1,250,000                         │
│ └─ Average Distribution: $458,333              │
│                                                  │
│ [Pagination] - Page 1 of 3                      │
└──────────────────────────────────────────────────┘
```

---

### 6.2 Distribution Detail Page (`/investment-manager/operations/distributions/[id]`)

**Purpose:** View distribution details and investor allocations

**Layout:**
```
┌────────────────────────────────────────────────────┐
│ DISTRIBUTION DETAIL                                │
│                                                    │
│ [← Back] [Edit] [Process] [Delete]                │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ DISTRIBUTION INFO                            │  │
│ │                                              │  │
│ │ Distribution Number: D-001                   │  │
│ │ Status: Completed                            │  │
│ │                                              │  │
│ │ Fund: Polibit Real Estate II                 │  │
│ │ Total Distribution Amount: $2,000,000        │  │
│ │ Distribution Date: Oct 31, 2024              │  │
│ │ Record Date: Oct 30, 2024                    │  │
│ │ Payment Date: Nov 15, 2024                   │  │
│ │                                              │  │
│ │ Source Breakdown:                            │  │
│ │ ├─ Operating Income: $1,000,000              │  │
│ │ ├─ Exit Proceeds: $500,000                   │  │
│ │ ├─ Preferred Return: $300,000                │  │
│ │ └─ Carried Interest: $200,000                │  │
│ │                                              │  │
│ │ Return of Capital: $1,000,000 (50%)          │  │
│ │ Investment Income: $1,000,000 (50%)          │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ WATERFALL ALLOCATION (if applicable)         │  │
│ │                                              │  │
│ │ Tier 1 - Return of Capital: $1,000,000       │  │
│ │ ├─ LP Share (100%): $1,000,000               │  │
│ │ └─ GP Share (0%): $0                         │  │
│ │                                              │  │
│ │ Tier 2 - Preferred Return: $700,000          │  │
│ │ ├─ LP Share (100%): $700,000                 │  │
│ │ └─ GP Share (0%): $0                         │  │
│ │                                              │  │
│ │ Tier 3 - GP Catch-Up: $200,000               │  │
│ │ ├─ LP Share (0%): $0                         │  │
│ │ └─ GP Share (100%): $200,000                 │  │
│ │                                              │  │
│ │ Tier 4 - Carried Interest: $100,000          │  │
│ │ ├─ LP Share (80%): $80,000                   │  │
│ │ └─ GP Share (20%): $20,000                   │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ INVESTOR ALLOCATIONS TABLE:                        │
│ ┌────────────────────────────────────────────┐   │
│ │ Investor | Ownership | Allocation | Paid   │   │
│ │ | Status | Payment Date | [Actions]        │   │
│ ├────────────────────────────────────────────┤   │
│ │ John Smith | 10% | $200,000 | $200,000     │   │
│ │ | Paid | Nov 15, 2024 | [View Receipt]     │   │
│ │                                             │   │
│ │ Acme Capital Partners | 40% | $800,000     │   │
│ │ | $800,000 | Paid | Nov 15, 2024           │   │
│ │ | [View Receipt]                           │   │
│ │                                             │   │
│ │ Smith Family Office | 50% | $1,000,000     │   │
│ │ | $1,000,000 | Paid | Nov 15, 2024         │   │
│ │ | [View Receipt]                           │   │
│ └────────────────────────────────────────────┘   │
│                                                    │
│ [Edit Distribution] [Mark Complete] [Delete]     │
└────────────────────────────────────────────────────┘
```

---

### 6.3 Create Distribution Page (`/investment-manager/operations/distributions/create`)

**Purpose:** Record a new distribution to investors

**Form Fields:**
```
┌──────────────────────────────────────────────────┐
│ CREATE DISTRIBUTION                              │
│                                                  │
│ SECTION 1: BASIC INFORMATION                    │
│ ├─ Structure (dropdown, required)               │
│ │  └─ [List of all structures]                  │
│ │                                               │
│ ├─ Total Distribution Amount (currency, req)    │
│ ├─ Currency (dropdown)                          │
│ │  └─ USD, EUR, MXN, etc.                       │
│ │                                               │
│ ├─ Distribution Date (date picker, required)    │
│ │  └─ Date when distribution is made            │
│ │                                               │
│ ├─ Record Date (date picker, required)          │
│ │  └─ Date to determine eligible investors      │
│ │                                               │
│ └─ Payment Date (date picker, required)         │
│    └─ Date when funds are transferred           │
│                                                  │
│ SECTION 2: SOURCE BREAKDOWN                     │
│ │                                               │
│ ├─ Source Type (radio, required):                │
│ │  ├─ Operating Income                         │
│ │  ├─ Exit Proceeds                            │
│ │  ├─ Preferred Return                         │
│ │  ├─ Carried Interest                         │
│ │  └─ Other (text input)                       │
│ │                                               │
│ └─ Amount Breakdown:                             │
│    ├─ Return of Capital Amount (currency)       │
│    │  └─ Optional input                         │
│    │                                             │
│    ├─ Investment Income Amount (currency)       │
│    │  └─ Optional input                         │
│    │                                             │
│    └─ Capital Gain Amount (currency)            │
│       └─ Optional input                         │
│                                                  │
│    Note: Total should = Total Distribution     │
│                                                  │
│ SECTION 3: INVESTOR ALLOCATIONS                 │
│ │                                               │
│ ├─ Auto-calculate based on ownership:           │
│ │  └─ [Show all investors with their ownership] │
│ │                                               │
│ ├─ Investor Allocations Table:                   │
│ │  ┌───────────────────────────────────────┐   │
│ │  │ Investor | Ownership | Distribution   │   │
│ │  ├───────────────────────────────────────┤   │
│ │  │ John Smith | 10% | $200,000           │   │
│ │  │ [Override Amount]                     │   │
│ │  │                                        │   │
│ │  │ Acme Capital | 40% | $800,000         │   │
│ │  │ [Override] [Remove]                   │   │
│ │  │                                        │   │
│ │  │ Smith Family | 50% | $1,000,000       │   │
│ │  │ [Override] [Remove]                   │   │
│ │  └───────────────────────────────────────┘   │
│ │                                               │
│ └─ Verify Total = Distribution Amount           │
│                                                  │
│ SECTION 4: WATERFALL (if applicable)            │
│ │                                               │
│ ├─ Auto-allocate through waterfall tiers:       │
│ │  └─ Show LP/GP split per tier                 │
│ │                                               │
│ └─ [Recalculate Waterfall]                      │
│                                                  │
│ SECTION 5: STATUS & SENDING                     │
│ ├─ Initial Status (dropdown):                   │
│ │  ├─ Pending (default)                        │
│ │  ├─ Processing                               │
│ │  └─ Completed                                │
│ │                                               │
│ └─ If Status = "Completed":                     │
│    ├─ Completion Date (auto-filled)            │
│    ├─ [Send Statements] toggle                 │
│    └─ [Email Investors] toggle                 │
│                                                  │
│ [Save as Draft] [Process Distribution]          │
└──────────────────────────────────────────────────┘
```

---

## 7. CAPITAL OVERVIEW

### 7.1 Commitments Page (`/investment-manager/capital-overview/commitments`)

**Purpose:** Overview of investor commitments by structure

**Display:**
```
┌──────────────────────────────────────────────────┐
│ CAPITAL OVERVIEW - COMMITMENTS                   │
│                                                  │
│ SUMMARY CARDS:                                   │
│ ┌────────────┬────────────┬────────────────────┐ │
│ │ Total      │ Committed  │ Called Capital     │ │
│ │ AUM        │ Not Called │                    │ │
│ │ $125M      │ $45M       │ $80M (64%)         │ │
│ └────────────┴────────────┴────────────────────┘ │
│                                                  │
│ STRUCTURE BREAKDOWN TABLE:                       │
│ ┌────────────────────────────────────────────┐  │
│ │ Fund | Committed | Called | Uncalled | % │ │
│ │      | Deployment                       │ │
│ ├────────────────────────────────────────────┤  │
│ │ Polibit Real Estate II                     │  │
│ │ | $50M | $32M | $18M | 64%                 │  │
│ │                                             │  │
│ │ Metropolitan Real Estate SPV                │  │
│ │ | $35M | $28M | $7M | 80%                  │  │
│ │                                             │  │
│ │ Caribbean Debt Fund II                     │  │
│ │ | $40M | $20M | $20M | 50%                 │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ CHARTS:                                          │
│ ├─ Pie: Commitment Distribution (by fund)      │  │
│ ├─ Bar: Called vs Uncalled Capital             │  │
│ └─ Trend: Deployment Rate Over Time            │  │
└──────────────────────────────────────────────────┘
```

---

### 7.2 Activity Page (`/investment-manager/capital-overview/activity`)

**Purpose:** Recent capital calls and distributions activity

**Display:**
```
┌──────────────────────────────────────────────────┐
│ CAPITAL OVERVIEW - ACTIVITY                      │
│                                                  │
│ ACTIVITY TIMELINE:                               │
│ │ Recent capital calls and distributions        │
│ │ sorted by date (newest first)                 │
│ │                                               │
│ ├─ Dec 15, 2024 - CAPITAL CALL                  │
│ │  Polibit Real Estate II - CC-001              │
│ │  Amount: $5,000,000                           │
│ │  Status: Sent (90% paid, $500k outstanding)  │
│ │  [View Details]                               │
│ │                                               │
│ ├─ Dec 1, 2024 - DISTRIBUTION                   │
│ │  Caribbean Debt Fund II - D-003               │
│ │  Amount: $750,000                             │
│ │  Type: Interest Income                        │
│ │  Status: Processing                           │
│ │  [View Details]                               │
│ │                                               │
│ ├─ Nov 15, 2024 - DISTRIBUTION                  │
│ │  Metropolitan Real Estate SPV - D-002         │
│ │  Amount: $500,000                             │
│ │  Type: Operating Income                       │
│ │  Status: Completed                            │
│ │  [View Details]                               │
│ │                                               │
│ └─ Nov 1, 2024 - CAPITAL CALL                   │
│    Polibit Real Estate II - CC-002              │
│    Amount: $3,000,000                           │
│    Status: Draft                                │
│    [View Details]                               │
│                                                  │
│ NET CASH POSITION:                               │
│ Total Called Capital: $80,000,000               │
│ Total Distributed: $15,250,000                  │
│ Net Position: +$64,750,000 (uninvested)        │
└──────────────────────────────────────────────────┘
```

---

## 8. REPORTS

### 8.1 Reports List Page (`/investment-manager/reports`)

**Purpose:** Generate, view, and manage reports

**Features:**
```
┌──────────────────────────────────────────────────┐
│ REPORTS PAGE                                     │
│                                                  │
│ [Search] [Filter] [+ Create New Report]         │
│                                                  │
│ FILTERS:                                         │
│ ├─ Report Type: [Dropdown] - All                │
│ │  ├─ Quarterly                                │
│ │  ├─ Annual                                   │
│ │  ├─ Monthly                                  │
│ │  ├─ Custom                                   │
│ │  ├─ Capital Call Report                      │
│ │  ├─ Distribution Report                      │
│ │  ├─ ILPA Performance Report                  │
│ │  └─ K-1 Tax Forms                            │
│ │                                               │
│ ├─ Status: [Dropdown] - All                     │
│ │  ├─ Draft                                    │
│ │  ├─ In Review                                │
│ │  ├─ Published                                │
│ │  └─ Sent                                     │
│ │                                               │
│ └─ Date Range: [Start] - [End]                  │
│                                                  │
│ REPORTS TABLE:                                   │
│ ┌────────────────────────────────────────────┐ │
│ │ Title | Type | Period | Status | Generated  │ │
│ │ | Recipients | [Actions]                   │ │
│ ├────────────────────────────────────────────┤ │
│ │ Q4 2024 Portfolio Report                    │ │
│ │ | Quarterly | Oct-Dec 2024 | Published      │ │
│ │ | Generated: Jan 5, 2025                    │ │
│ │ | Sent to: 15 investors (10 opened)         │ │
│ │ | [View] [Edit] [Resend] [Export] [Delete] │ │
│ │                                              │ │
│ │ Annual Performance 2024                     │ │
│ │ | Annual | Jan-Dec 2024 | Draft             │ │
│ │ | Generated: Jan 8, 2025                    │ │
│ │ | [View] [Edit] [Publish] [Send] [Delete]  │ │
│ │                                              │ │
│ │ Custom Dashboard Analysis                   │ │
│ │ | Custom | Oct-Dec 2024 | In Review         │ │
│ │ | Generated: Jan 6, 2025                    │ │
│ │ | [View] [Edit] [Approve] [Delete]          │ │
│ └────────────────────────────────────────────┘ │
│                                                  │
│ [Pagination] - Page 1 of 2                      │
└──────────────────────────────────────────────────┘
```

---

### 8.2 Report Detail/Builder Page (`/investment-manager/reports/[id]`, `/reports/builder`)

**Purpose:** View, edit, and configure reports

**Features:**
```
Report Builder sections:
├─ Report Type selector
├─ Period selection (start/end dates)
├─ Metrics selection (customizable)
├─ Include/exclude investors
├─ Include/exclude investments
├─ Export format (PDF, Excel, CSV)
├─ Report preview
└─ Publish/Send workflow
```

---

## 9. WATERFALLS

### 9.1 Waterfall Calculator Page (`/investment-manager/waterfalls`)

**Purpose:** Visualize and calculate profit distribution

**Features:**
```
┌──────────────────────────────────────────────────┐
│ WATERFALL CALCULATOR                             │
│                                                  │
│ STRUCTURE SELECTION:                             │
│ ├─ Select Fund: [Dropdown]                       │
│ │  └─ Polibit Real Estate II                    │
│ │                                               │
│ └─ Waterfall Type (read-only):                   │
│    └─ American Waterfall                        │
│                                                  │
│ INPUT SECTION:                                   │
│ ├─ Total Profit to Distribute: $[Input]         │
│ │  └─ Example: $5,000,000                       │
│ │                                               │
│ └─ [Calculate Waterfall]                         │
│                                                  │
│ WATERFALL VISUALIZATION:                         │
│ │                                               │
│ │ TIER 1: Return of Capital                     │
│ │ ├─ Target: Return all capital first           │
│ │ ├─ LP Share: 100% → $2,000,000                │
│ │ └─ GP Share: 0% → $0                          │
│ │                                               │
│ │ TIER 2: Preferred Return (8% IRR)             │
│ │ ├─ Target: 8% annual return                   │
│ │ ├─ LP Share: 100% → $2,500,000                │
│ │ └─ GP Share: 0% → $0                          │
│ │                                               │
│ │ TIER 3: GP Catch-Up (American only)           │
│ │ ├─ Target: Reach 20% carry parity            │
│ │ ├─ LP Share: 0% → $0                          │
│ │ └─ GP Share: 100% → $300,000                  │
│ │                                               │
│ │ TIER 4: Carried Interest (20/80 split)        │
│ │ ├─ Remaining profit: $200,000                 │
│ │ ├─ LP Share: 80% → $160,000                   │
│ │ └─ GP Share: 20% → $40,000                    │
│ │                                               │
│ │ ═══════════════════════════════════════       │
│ │ TOTAL ALLOCATION:                             │
│ │ LP Total: $4,660,000 (93.2%)                  │
│ │ GP Total: $340,000 (6.8%)                     │
│ │                                               │
│ INVESTOR LEVEL BREAKDOWN:                        │
│ ├─ John Smith (10%):                            │
│ │  ├─ Tier 1 Share: $200,000                   │
│ │  ├─ Tier 2 Share: $250,000                   │
│ │  ├─ Tier 4 Share: $16,000                    │
│ │  └─ Total: $466,000                          │
│ │                                               │
│ ├─ Acme Capital (40%):                          │
│ │  ├─ Tier 1 Share: $800,000                   │
│ │  ├─ Tier 2 Share: $1,000,000                 │
│ │  ├─ Tier 4 Share: $64,000                    │
│ │  └─ Total: $1,864,000                        │
│ │                                               │
│ └─ Smith Family (50%):                          │
│    ├─ Tier 1 Share: $1,000,000                 │
│    ├─ Tier 2 Share: $1,250,000                 │
│    ├─ GP Catch-Up: $300,000                    │
│    ├─ Tier 4 Share: $80,000                    │
│    └─ Total: $3,630,000                        │
│                                                  │
│ [Export PDF] [Export Excel] [Save Scenario]     │
│ [Run Scenarios] [Reset]                         │
└──────────────────────────────────────────────────┘
```

---

## 10. ADDITIONAL SECTIONS

### 10.1 Account Page (`/investment-manager/account`)

**Purpose:** Manage user profile

**Fields:**
```
├─ First Name (text input)
├─ Last Name (text input)
├─ Email (email input, display-only)
├─ Phone (tel input)
├─ Avatar Upload (image upload)
├─ Language Preference (dropdown):
│  └─ English, Español, Français, Deutsch
└─ [Save Profile Changes]
```

---

### 10.2 Settings Page (`/investment-manager/settings`)

**Purpose:** System and firm settings

**Sections:**
```
├─ FIRM SETTINGS
│  ├─ Firm Name (text input)
│  ├─ Headquarters Location (text input)
│  ├─ Tax ID (text input)
│  └─ Default Currency (dropdown)
│
├─ PREFERENCES
│  ├─ Default Report Format (PDF, Excel, CSV)
│  ├─ Email Notifications (toggle)
│  ├─ Default Waterfall Type (American/European)
│  └─ Display Timezone (dropdown)
│
└─ ADVANCED
   ├─ API Access (if applicable)
   ├─ Data Export (bulk export option)
   └─ System Integration Settings
```

---

### 10.3 Help & Chat

**Purpose:** Support and assistance

```
├─ Help Page
│  └─ FAQ, Tutorials, Documentation Links
│
└─ Chat Widget
   └─ Real-time chat support
```

---

## 11. DATA RELATIONSHIPS

### Core Relationship Diagram

```
Structure
├─ Has many Investors (pre-registered & actual)
├─ Has many Investments
├─ Has many CapitalCalls
├─ Has many Distributions
├─ Has many WaterfallTiers
├─ Has many Documents
├─ Has parent Structure (hierarchy)
└─ Has many child Structures (hierarchy)

Investor
├─ Belongs to Structure(s) - multi-structure possible
├─ Has many CapitalCalls (per structure)
├─ Has many Distributions (per structure)
├─ Has CustomInvestorTerms (per structure)
└─ Has many Documents

Investment
├─ Belongs to Structure
├─ Has EquityPosition (optional)
├─ Has DebtPosition (optional)
├─ Affects Ownership% calculation
└─ Has Documents

CapitalCall
├─ Belongs to Structure
├─ Has many InvestorAllocations
└─ Linked to Investment (optional)

Distribution
├─ Belongs to Structure
├─ Has many InvestorAllocations
├─ Allocated through WaterfallTiers
└─ May be linked to CapitalCall (repayment)

WaterfallTier
├─ Belongs to Structure
├─ Affects Distributions
└─ Has LP/GP allocation percentages
```

---

## 12. WORKFLOW PATTERNS

### Standard CRUD Pattern

```typescript
// Get all items
GET /[resource] → List Page

// Get single item
GET /[resource]/[id] → Detail Page

// Create item
POST /[resource]/create → Create Page

// Update item
PUT /[resource]/[id] → Edit Page

// Delete item
DELETE /[resource]/[id] → Cascade to children
```

### Capital Call Workflow

```
1. Draft
   ├─ Create in system
   ├─ Calculate investor allocations
   └─ Can edit/delete

2. Send
   ├─ Mark as sent
   ├─ Record sent date
   ├─ Send notifications to investors
   └─ No longer editable (cancel instead)

3. Payment Collection
   ├─ Record payments per investor
   ├─ Track partial payments
   ├─ Flag overdue payments
   └─ Update outstanding balance

4. Close
   ├─ Mark as Fully Paid
   ├─ Archive
   └─ Move to history
```

### Distribution Workflow

```
1. Pending
   ├─ Create distribution
   ├─ Allocate through waterfall
   ├─ Calculate per-investor shares
   └─ Prepare for processing

2. Processing
   ├─ Initiate payments
   ├─ Track payment confirmations
   └─ Monitor completion

3. Completed
   ├─ All payments confirmed
   ├─ Record actual payment dates
   ├─ Generate investor statements
   └─ Archive
```

### Report Workflow

```
1. Draft
   ├─ Build report
   ├─ Select metrics
   ├─ Configure layout
   └─ Preview

2. In Review
   ├─ Internal review
   ├─ Request changes
   └─ Approve changes

3. Published
   ├─ Finalize report
   ├─ Lock from editing
   └─ Ready to send

4. Sent
   ├─ Email to recipients
   ├─ Track opens
   └─ Archive
```

---

This comprehensive mapping covers all sections of the investment manager platform with complete field specifications, relationships, and workflows!
