# LP Portal Complete Architecture Map

**Last Updated:** November 10, 2025
**Purpose:** Complete reference guide for the Limited Partner (Investor) Portal - all pages, fields, workflows, and data structures

---

## Table of Contents

1. [Portal Navigation](#portal-navigation)
2. [Page-by-Page Specifications](#page-by-page-specifications)
3. [Data Models](#data-models)
4. [Workflows](#workflows)
5. [Components & Storage](#components--storage)
6. [Calculation Rules](#calculation-rules)

---

## Portal Navigation

### Main Navigation Structure

**URL Base:** `/lp-portal/`

**Sidebar Navigation Items:**
```typescript
navItems = [
  {
    label: 'Dashboard',
    href: '/lp-portal/dashboard',
    icon: IconDashboard,
  },
  {
    label: 'Commitments',
    href: '/lp-portal/commitments',
    icon: IconTrendingUp,
  },
  {
    label: 'Documents',
    href: '/lp-portal/documents',
    icon: IconFileText,
  },
  {
    label: 'Communications',
    href: '/lp-portal/communications',
    icon: IconUsers,
  },
]
```

**Main Routes:**
- `/lp-portal/dashboard` - Main dashboard with customizable widgets
- `/lp-portal/commitments` - Capital commitments overview
- `/lp-portal/portfolio` - Portfolio listing and overview
- `/lp-portal/portfolio/[structureId]` - Detailed structure/fund data room
- `/lp-portal/portfolio/[structureId]/investments` - Fund's investment portfolio
- `/lp-portal/portfolio/[structureId]/waterfall` - Distribution waterfall model
- `/lp-portal/capital-calls` - All capital calls list
- `/lp-portal/capital-calls/[id]/summary` - Capital call details
- `/lp-portal/capital-calls/[id]/payment` - Payment submission form
- `/lp-portal/distributions/[id]` - Distribution details
- `/lp-portal/activity` - Capital calls & distributions activity summary
- `/lp-portal/documents` - Fund and personal documents
- `/lp-portal/account` - Investor profile & settings
- `/lp-portal/chat` - Investor communications (placeholder)
- `/lp-portal/support` - Support & help (placeholder)
- `/lp-portal/search` - Search across portal (placeholder)
- `/lp-portal/settings` - Portal settings (placeholder)
- `/lp-portal/login` - Authentication (placeholder)

---

## Page-by-Page Specifications

### 1. Dashboard (`/lp-portal/dashboard`)

**Purpose:** Customizable, drag-and-drop investor dashboard with key metrics and charts

**Layout:**
- Responsive grid with draggable widgets (dnd-kit)
- Flat list layout (vertical stacking on mobile)
- Widget sizes: small (25% width), medium (50%), large (100%)

**Components:**

#### Header Controls
```
Filter by Fund [Dropdown: All Funds, Fund 1, Fund 2, ...]
[+ Add a Graph Button]
```

#### Fixed Widgets (Pre-loaded)

**1. Portfolio Summary Cards** (4 cards in grid)
| Card | Data | Color | Logic |
|------|------|-------|-------|
| Total Commitment | Sum of all commitments | Primary | `commitments.reduce((sum, s) => sum + s.commitment, 0)` |
| Current Value | Sum of portfolio values | Primary | `structures.reduce((sum, s) => sum + s.currentValue, 0)` |
| Total Return | Current Value - Called Capital + Distributions | Green/Red | Dynamic color based on sign |
| Total Distributed | Lifetime distributions received | Green | Sum of all completed distribution allocations |

**Data Calculation for Portfolio Cards:**
```typescript
const totalCommitment = structures.reduce((sum, s) => sum + s.commitment, 0)
const calledCapital = structures.reduce((sum, s) => sum + s.calledCapital, 0)
const currentValue = structures.reduce((sum, s) => sum + s.currentValue, 0)

// Total Distributed = sum of all finalAllocations from completed distributions
const allDistributions = getDistributions()
const totalDistributed = allDistributions
  .filter(dist => dist.investorAllocations.some(alloc => alloc.investorId === investorId))
  .reduce((sum, dist) => {
    const allocation = dist.investorAllocations.find(alloc => alloc.investorId === investorId)
    return sum + (allocation?.finalAllocation || 0)
  }, 0)

const totalReturn = totalDistributed + currentValue - calledCapital
```

**2. Capital Deployment Card** (large widget)
```
Title: "Capital Deployment"
Subtitle: "Your commitment vs. called capital"

[Called Capital: $X] [Uncalled Capital: $Y] [Deployment Rate: Z%]

[Progress Bar showing deployment percentage]
```

**3. Portfolio Breakdown Table** (large widget)
Scrollable card with rows for each structure investor is in:
```
| Fund Name | Type | Commitment | Called | Current Value | Unrealized Gain |
|-----------|------|------------|--------|-----------------|-----------------|
| Fund 1    | Real Estate | $500k | $250k | $280k | $30k ✓ |
| Fund 2    | PE | $1M | $1M | $950k | -$50k ✗ |

[View All] button to /lp-portal/commitments
```

#### Custom Widgets
- **Metric Cards:** User-added metric widgets (single number + description)
- **Charts:** Line charts, bar charts, pie charts (via CustomChartRenderer)
- **Custom Dimensions:** small, medium, large

**Functionality:**
- Drag-and-drop reordering (dnd-kit integration)
- Global fund filter (affects custom charts, not fixed cards)
- Add/Edit/Delete custom widgets via modal dialog
- localStorage persistence: `getDashboardConfig()`, `reorderWidgets()`, `removeWidget()`, `addWidget()`

**Filter Logic:**
```typescript
// Global filter affects only custom chart widgets
if (widget.ignoreFilter) return true  // Skip filter for fixed widgets
if (globalFilter === 'all') return true
// Apply filter by widget's fundId
const config = widget.config as any
return config.fundId === globalFilter
```

---

### 2. Commitments (`/lp-portal/commitments`)

**Purpose:** View all capital commitments across all funds

**Page Layout:**

#### Header
```
Title: "Commitments"
Subtitle: "View your capital commitments across all funds"
```

#### Summary Cards (4 cards)
```
| Total Commitment | Called Capital | Uncalled Capital | Active Funds |
|------------------|----------------|------------------|--------------|
| $1.5M (Primary)  | $750k (Orange) | $750k (Green)    | 2            |
```

#### Commitments Grid (3 columns on desktop, responsive)

**Per-Fund Card:**
```
Header:
  [Fund Name] [Status Badge: Active/KYC/Contracts/Pending/Payments]
Content:
  [My Commitment] [Ownership %]
  [Called] [Uncalled]
  [Capital Called Progress Bar] (% progress)
  [Fund Size]

States:
  If onboardingStatus !== 'Active' OR commitment === 0:
    [Alert Box: "Commitment Not Set / Onboarding In Progress"]
    [Set Commitment / Continue Onboarding Button] → `/lp-portal/onboarding/[fundId]`
  Else:
    [All fields visible]
```

**Data Structure (InvestorCommitmentData):**
```typescript
{
  id: string                    // fundId
  fundName: string
  fundId: string
  structureType: string         // Fund, SPV, etc.
  subtype: string
  status: string                // Active, Pending, etc.
  onboardingStatus: string      // Active, KYC/KYB, Contracts, Payments, Pending
  commitment: number
  calledCapital: number         // Calculated from capital call payments
  uncalledCapital: number       // commitment - calledCapital
  ownershipPercent: number      // calledCapital / totalFundSize * 100
  currency: string              // USD, etc.
  totalFundSize: number         // structure.totalCommitment
  commitmentProgress: number    // (calledCapital / commitment) * 100
}
```

**Calculation Logic:**
```typescript
const investorCommitments = investor.fundOwnerships.map(ownership => {
  const structure = allStructures.find(s => s.id === ownership.fundId)
  const commitment = ownership.commitment || 0

  // Calculate called capital from actual capital call payments
  const fundCapitalCalls = allCapitalCalls.filter(cc => cc.fundId === ownership.fundId)
  const investorAllocations = fundCapitalCalls
    .map(cc => cc.investorAllocations.find(alloc => alloc.investorId === investor.id))
    .filter(alloc => alloc !== undefined)

  const calledCapital = investorAllocations.reduce((sum, alloc) =>
    sum + (alloc?.amountPaid || 0), 0)

  const uncalledCapital = commitment - calledCapital
  const ownershipPercent = totalFundSize > 0
    ? (calledCapital / totalFundSize) * 100
    : 0

  return { ...data }
})
```

---

### 3. Portfolio (`/lp-portal/portfolio`)

**Purpose:** Overview of all investment structures with portfolio value tracking

**Page Layout:**

#### Header
```
Title: "Portfolio"
Subtitle: "Overview of your investment structures and performance"
```

#### Summary Cards (3 columns)
```
| Total Commitment | Called Capital | Current Value |
|------------------|----------------|---------------|
| $1.5M (Wallet)   | $750k / 50% of commitment (DollarSign) | $800k / +6.7% unrealized gain (TrendingUp) |
```

#### Portfolio Value Over Time Chart
**Type:** Line Chart (Recharts)

**Data:**
```
Monthly timeline with:
- Portfolio Value (dark line)
- Distributions Received (green line)
- X-axis: Jan 2024 → Nov 2025
- Y-axis: Currency format ($)
```

**Sample Data Structure:**
```typescript
{
  date: 'Jan 2024',
  value: 0,
  invested: 0,
  distributed: 0
}
// ... monthly entries through Nov 2025
```

**Annotations below chart:**
- Initial Investment: February 2024 • Amount: $200,000
- Distributions Received: $8,500 (Sep 2025) + $4,500 (Scheduled Nov 2025)
- Current Portfolio Value: $212,500 (6.25% return including scheduled distributions)

#### Filters & Controls
```
[Search box: "Search structures..."]
[Type dropdown: All Types, Fund, SPV, Real Estate Fund, PE Fund, Private Debt Fund]
[Status dropdown: All Status, Active, Pending]
[Grid/List view toggle]
```

#### Structures Grid (responsive, toggles between grid/list)

**Structure Card (Grid View):**
```
Header:
  [Icon] [Structure Name]
         [Type as descriptor]
  [Status Badge: Active/Pending]

Content:
  [Commitment] [Called Capital] [Ownership %] [Current Value]

  If commitment > 0:
    [Unrealized Gain (green/red)]
    [View Details Button] → `/lp-portal/portfolio/[structureId]`
  Else:
    [Onboarding message]
    [Complete Onboarding Button] → `/lp-portal/onboarding/[structureId]`
```

**Filtering Logic:**
```typescript
const filteredStructures = structures.filter(structure => {
  const matchesSearch = structure.name.toLowerCase().includes(searchQuery.toLowerCase())
  const matchesType = typeFilter === 'all' || structure.type === typeFilter
  const matchesStatus = statusFilter === 'all' ||
    (statusFilter === 'active' && structure.commitment > 0) ||
    (statusFilter === 'pending' && structure.commitment === 0)
  return matchesSearch && matchesType && matchesStatus
})
```

---

### 4. Structure Data Room (`/lp-portal/portfolio/[structureId]`)

**Purpose:** Detailed investor view of a single fund/structure with comprehensive information

**Dynamic Route:** `params: Promise<{ structureId: string }>`

**Page Layout:**

#### Header
```
[Back Button] [Building Icon] [Structure Name]
                              [Structure Type]
              [Active/Pending Badge]
```

#### Key Metrics Grid (4 cards)
```
| My Commitment | Called Capital | Current Value | TVPI |
|----------------|---|---|---|
| $500k (8.2% ownership) | $250k / 50% of commitment | $280k | 1.12x |
```

#### Tabbed Interface

**Tab 1: Overview**

**Section: Structure Details**
```
2-column grid:
  Structure Name | Type
  Subtype | Jurisdiction
  Currency | Status
  Inception Date | Created Date
  Fund Term | Fund Type (if available)
```

**Section: My Investment Terms**
```
2-column layout:
  Left: Standard Terms
    - Management Fee: X%
    - Performance Fee: Y%
    - Preferred Return: Z%
    - Hurdle Rate: W%

  Right: My Custom Terms (if applicable)
    [Highlighted in primary color]
    - Shows overrides if investor has custom economic terms
    - Strikethrough standard terms where overridden
```

**Section: Performance Metrics**
```
6 metrics in grid:
  IRR | MOIC | TVPI
  DPI | RVPI | Total Distributed

  Calculations:
  - tvpi = (totalDistributed + currentValue) / calledCapital
  - dpi = totalDistributed / calledCapital
  - rvpi = currentValue / calledCapital
  - moic = tvpi (simplified)
  - irr = mock calculation based on gains vs capital
```

**Section: Waterfall & Distribution Model**
```
Waterfall Structure: [American/European/Hybrid]
Distribution Frequency: [Quarterly/Monthly/etc]

4-tier distribution hierarchy:
  1. Return of Capital - 100% to LPs until capital returned
  2. Preferred Return - 100% to LPs until [X]% achieved
  3. GP Catch-Up - 100% to GP until [Y]% earned
  4. Carried Interest - [Z]% to LPs, [100-Z]% to GP
```

**Section: Investment Summary**
```
[Table format:]
  Total Commitment: $X
  Called Capital: $Y
  Uncalled Capital: $Z
  Current Value: $A
  Unrealized Gain/Loss: $B (green/red)
```

**Section: Portfolio Information**
```
Current Investments: N
Planned Investments: M
Min Check Size: $X
Max Check Size: $Y
```

**Section: Key Dates & Contacts**
```
Left side (Key Dates):
  Fund Inception: [date]
  My Investment Date: [date]
  Fund Term: [years]
  Next Report: [frequency]

Right side (Contacts):
  Fund Manager Contact
  Polibit Investment Management
  Email: investors@polibit.io
  Phone: +1 (555) 123-4567
```

**Section: Upcoming Events**
```
If pending capital calls exist:
  [Orange Alert] "Pending Capital Call"
  "You have N pending capital call(s)"
Else:
  [Info Box] "No upcoming events at this time"
  "You will be notified of any capital calls or distributions"
```

---

**Tab 2: Legal & Terms** (Extensive)

**Section: Subscription Agreement**
```
[Card with table format:]
  Subscription Amount | $X (initial commitment)
  Ownership Interest | Y% (fund ownership)
  Subscription Date | [date]
  Investor Type | [e.g., "Family Office"]
  Accreditation Status | [Badge: "Accredited Investor"]
```

**Section: Partnership Agreement**
```
**Management & Control**
[Standard boilerplate text about GP authority and LP limitations]

**Capital Contributions**
- Total commitment: $X
- Standard notice: 15 business days
- Payment deadline: [X] business days of notice
- Minimum notice period: [X] business days

**Allocations & Distributions**
- Profits/losses allocated per partnership interests
- GP determines distributions per waterfall
- Frequency: [Quarterly/Monthly/etc]
```

**Section: Fee Schedule**
```
3 primary fee boxes with custom term override indicators:

[Management Fee]
  X% per annum
  Calculated on committed capital (investment period),
  then on invested capital (harvest period)
  Payable quarterly in arrears
  [If custom: "Custom rate: X% (Standard: Y%)"]

[Performance Fee (Carried Interest)]
  X%
  GP receives X% of realized/unrealized gains
  After return of capital and preferred return
  [If custom: "Custom rate: X% (Standard: Y%)"]

[Preferred Return]
  X% per annum
  LPs receive X% before GP participates in carried interest
  [If custom: "Custom rate: X% (Standard: Y%)"]

[Hurdle Rate] (if applicable)
  X% per annum
  Minimum return threshold before performance fees earned
  [If custom: "Custom rate: X% (Standard: Y%)"]

[Expense Reimbursement Box - Orange]
  "Partnership reimburses GP for ordinary and necessary expenses
   (legal, accounting, administrative)"
```

**Section: Rights & Obligations**

**LP Rights** (bulleted list):
- Receive quarterly financials and annual audited financials
- Receive K-1 tax forms annually by March 15
- Attend annual investor meetings
- Receive distributions per waterfall
- Inspect partnership books/records
- Receive capital call notices [X] business days in advance
- Pro-rata participation in future fundraising

**LP Obligations** (bulleted list):
- Fund capital calls within [X] business days
- Maintain accredited investor status
- Provide updated tax info annually
- Notify GP of contact changes
- Comply with transfer restrictions
- Indemnify Partnership for breaches

**Section: Voting Rights**
```
[Info text:]
"The following actions require consent of LPs holding at least [66.67]%
of Partnership Interests:"

Matters Requiring Consent:
- Amendment of Partnership Agreement
- Removal of GP for cause
- Extension of fund term beyond initial + permitted extensions
- Dissolution prior to fund term end
- Change in investment strategy/restrictions
- Increase in management/performance fees
- Transfer of GP interest to third party

[Your Voting Power Box]
"Your Voting Power: Y.YY% of total Partnership Interests"
```

**Section: Redemption & Withdrawal**
```
[Orange Alert Box - Lock-Up Period]
"Your capital commitment is subject to a lock-up period through the
earlier of (i) end of investment period or (ii) [10] years from inception.
No redemptions permitted during lock-up except extraordinary circumstances."

Withdrawal Conditions (if permitted):
- Death or disability of individual investor
- Bankruptcy or insolvency
- Regulatory requirement
- With GP consent in sole discretion

Withdrawal Process:
- Written notice to GP at least 90 days in advance
- Subject to GP approval
- Withdrawal price = most recent NAV less 2% early withdrawal penalty
- Payment within 180 days of approval, subject to liquidity
```

**Section: Transfer Restrictions**
```
[Red Alert - General Prohibition]
"Partnership Interests may not be sold, assigned, transferred, pledged,
or otherwise disposed of without prior written consent of GP
(which may be withheld in its sole discretion)"

Permitted Transfers (with GP consent):
- Transfers to immediate family/family trusts
- Transfers to wholly-owned affiliates
- Transfers required by law/court order
- Transfers to other existing LPs

Transfer Requirements:
- Transferee must be accredited investor and qualified purchaser
- Transferee must execute subscription documents
- Must comply with securities laws
- Transferor responsible for legal fees/transfer taxes
- GP may charge administrative fee
```

**Section: Reporting Frequency Commitments**
```
4 boxes showing reporting cadence:

[Quarterly Reports]
"Unaudited financials, NAV updates, portfolio summaries
within 45 days of quarter end"

[Annual Reports]
"Audited financial statements and detailed portfolio review
within 120 days of year end"

[Tax Forms (K-1)]
"Schedule K-1 (Form 1065) delivered by March 15th annually"

[Capital Notices]
"Capital call and distribution notices sent at least [X] business days
in advance"

Additional Communications:
- Annual investor meeting
- Material event notifications
- Valuation updates for significant portfolio changes
- Regulatory filings
- Access to online investor portal
```

**Section: Liability Limitations**
```
[Green Alert - Limited Liability Protection]
"As a Limited Partner, your liability is limited to your capital commitment.
You shall not be liable for any debts/obligations/liabilities of the
Partnership beyond your committed capital contribution."

Exceptions to Limited Liability:
- Return of distributions: wrongful distributions may be reclaimed
- Participation in control: active participation may expose to general liability
- Fraud or willful misconduct: intentional wrongdoing not protected
- Breach of representations: false subscription statements
- Environmental claims: certain claims may pierce limited liability

[Info Box - Your Maximum Exposure]
"Your Maximum Exposure: $X (committed capital) plus potential clawback
of distributions within past 12 months in extraordinary circumstances"
```

**Section: Indemnification Clauses**
```
Partnership Indemnifies You For:
- Claims from Partnership activities in good faith
- Litigation related to your LP status
- Environmental claims related to Partnership properties
- Third-party claims from Partnership investments

You Indemnify Partnership For:
- Breach of representations/warranties
- Violation of transfer restrictions
- Unauthorized disclosure of confidential info
- Tax liabilities from your failure to provide info
- Claims from your willful misconduct/gross negligence

Indemnification Procedures:
- Prompt written notice of any claim
- Indemnifying party assumes defense
- Indemnified party may participate at own expense
- No settlement without indemnified party consent
```

---

**Tab 3: Capital Calls ([N] items)**

**If no capital calls:**
```
[Icon] [Large message]
"No Capital Calls"
"No capital calls have been issued for this structure yet"
```

**If capital calls exist:**
```
Per-Capital-Call Card:
  Header:
    Call #[number] [date]
    [Status Badge]

  Content:
    [My Amount] [Paid (green)]
    [Due Date] [Outstanding (orange)]

    If purpose exists:
      [Purpose section with description]
```

---

**Tab 4: Distributions ([N] items)**

Similar to Capital Calls tab:
```
Per-Distribution Card:
  Header:
    Distribution #[number] [date]
    [Status Badge: Pending/Processing/Completed/Failed]

  Content:
    [My Distribution (green)] [Total Distributed]

    If purpose exists:
      [Purpose section]
```

---

**Tab 5: Reports**

**Report Type Cards (3 cards):**

1. **Quarterly Reports**
   - Unaudited financial statements
   - NAV updates
   - Portfolio performance metrics
   - Capital deployed & available
   - Key portfolio updates
   - Timeline: Within 45 days of quarter end

2. **Annual Reports**
   - Audited financial statements
   - Annual portfolio review
   - Year-over-year performance
   - Investment metrics & KPIs
   - Management commentary
   - Timeline: Within 120 days of year end

3. **Tax Documents**
   - Schedule K-1 (Form 1065)
   - Tax allocation schedules
   - AMT considerations
   - Section 461(l) info
   - Partner basis statements
   - Timeline: By March 15th annually

**Available Reports Section:**
```
[List of sample reports with download buttons]
- Q4 2024 Quarterly Report (PDF)
- Q3 2024 Quarterly Report (PDF)
- 2024 Annual Report (PDF)
- 2024 Schedule K-1 (Form 1065) (PDF)
- 2023 Annual Report (PDF)

[Info box]
"Reports are available once published by fund manager.
Check back regularly for latest updates."
```

---

**Tab 6: Documents**

```
[Placeholder - Coming Soon]
"Documents Coming Soon"
"Access to fund documents, agreements, and legal materials
will be available here"
```

---

### 5. Capital Calls (`/lp-portal/capital-calls`)

**Purpose:** View all pending and completed capital calls

**Page Layout:**

#### Header
```
Title: "Capital Calls"
Subtitle: "View and respond to capital calls from your funds"
```

#### Summary Cards (4 columns)
```
| Total Called | Total Paid | Outstanding | Total Calls |
|---|---|---|---|
| $X (Primary) | $Y (Green) | $Z (Orange) | N |
```

#### Capital Calls Grid (3 columns, responsive)

**Capital Call Card:**
```
Header:
  [Fund Name] [Status Badge with Icon]
  Call #[number]

Content:
  [Call Date] [Due Date]

  [My Amount] [Paid - green]
  [Outstanding - orange]

  [Progress Bar showing paid/outstanding]

  If purpose exists:
    [Purpose: text]

  If overdue and not paid:
    [Red Alert] "Payment Overdue"
    "Please contact your fund manager"

  Action Buttons:
    If paid: [View Details Button] → `/lp-portal/capital-calls/[id]/summary`
    If not paid: [Pay Now Button] → `/lp-portal/capital-calls/[id]/payment`
```

**Data Structure (InvestorCapitalCall):**
```typescript
{
  id: string
  fundName: string
  fundId: string
  callNumber: number
  callDate: string
  dueDate: string
  status: string              // Draft, Sent, Pending, Paid, Overdue, Cancelled
  currency: string
  myCallAmount: number        // From investorAllocation.amountDue
  myPaidAmount: number        // From investorAllocation.amountPaid
  myOutstandingAmount: number // amountDue - amountPaid
  totalCallAmount: number
  purpose: string
}
```

**Calculation:**
```typescript
// Status is from investorAllocation.status
// If date > today and status !== 'Paid' and status !== 'Cancelled':
//   Show "Overdue" in header

const investorCalls = allCapitalCalls
  .filter(call => investorStructureIds.includes(call.fundId))
  .map(call => {
    const myAllocation = call.investorAllocations.find(
      alloc => alloc.investorId === investor.id
    )
    return {
      // ... spread call data
      myCallAmount: Number(myAllocation.amountDue) || 0,
      myPaidAmount: Number(myAllocation.amountPaid) || 0,
      myOutstandingAmount: Number(myAllocation.amountOutstanding) ||
                          (Number(myAllocation.amountDue) || 0),
      status: myAllocation.status || 'Pending'
    }
  })
```

---

### 6. Capital Call Payment (`/lp-portal/capital-calls/[id]/payment`)

**Purpose:** Complete payment for a capital call

**Dynamic Route:** `params: useParams()` (id from URL)

**Page Layout:**

#### Header
```
[Back Button] "Complete Payment"
Subtitle: "Capital Call #[N] - [Fund Name]"
```

#### Overdue Alert (if applicable)
```
[Red Alert Box]
"Payment Overdue: This capital call was due on [DATE].
Please complete payment as soon as possible."
```

#### Two-Column Layout

**Left Column: Payment Summary Card**
```
Fund: [name]
Call Number: #[N]
Call Date: [date]
Due Date: [date]

---

Purpose: [text description]

---

Amount Due: [Large, primary color]
```

**Right Column: Payment Method Selection**

**Radio Group with 3 options:**

1. **Bank Account / ACH**
   - "Most common method. Direct bank transfer (3-5 business days)"
   - Selected by default

2. **Credit Card**
   - "Instant payment via Stripe (processing fees may apply)"

3. **Cryptocurrency**
   - "Pay with Bitcoin, Ethereum, or USDC via Stripe"

---

#### Bank Account Form (shown when 'bank' selected)

```
Account Holder Name* [input, pre-filled with investor name]
Bank Name* [input]
Account Number* [text input]
Routing Number* [text input]

Account Type:
  ◯ Checking (default)
  ◯ Savings

[Info Box]
"Bank transfers typically take 3-5 business days to process.
Your payment will be confirmed once the transfer is complete."
```

---

#### Action Buttons (bottom)

```
[Cancel Button (outlined)] [Submit Bank Transfer Button (filled, large)]
```

**Button text changes based on payment method:**
- Bank: "Submit Bank Transfer"
- Card: "Pay with Credit Card"
- Crypto: "Pay with Crypto"

**Processing state:** Button disabled with loading spinner

---

#### Security Notice (bottom)

```
[Green checkmark icon]
"Secure Payment Processing"
"Your payment information is encrypted and processed securely.
We never store your full bank account or card details."
```

**Payment Flow Logic:**
```typescript
const handleBankPayment = async () => {
  // Validation
  if (!bankFormData.accountHolderName || !bankFormData.bankName ||
      !bankFormData.accountNumber || !bankFormData.routingNumber) {
    alert('Please fill in all bank account fields')
    return
  }

  // Simulate processing (2 seconds in demo)
  const updated = updateInvestorPayment(
    capitalCall.id,
    investorId,
    investorAllocation.callAmount,
    {
      paymentMethod: 'Bank Transfer / ACH',
      transactionReference: `ACH-${Date.now()}`,
      bankDetails: `${bankFormData.bankName} - Account ending in ${accountNumber.slice(-4)}`
    }
  )

  if (updated) {
    // Success message and redirect
    window.location.href = '/lp-portal/capital-calls'
  }
}
```

---

### 7. Activity (`/lp-portal/activity`)

**Purpose:** Consolidated view of capital calls and distributions activity

**Page Layout:**

#### Header
```
Title: "My Activity"
Subtitle: "Track your capital contributions and distributions"
```

#### Summary Cards (5 columns)
```
| Total Called | Paid | Outstanding | Distributed | Net Cash Position |
|---|---|---|---|---|
| $X | $Y (Green) | $Z (Orange) | $A (Blue) | $B (Green/Red) |
```

**Net Cash Position Calculation:**
```typescript
const netCash = totalDistributed - totalPaid
// Positive = received more than paid
// Negative = paid more than received (net invested)
```

---

#### Tabbed View

**Tab 1: Capital Calls**

**Summary Section:**
```
Header with [View All] button → `/lp-portal/capital-calls`

Table if calls exist:
  | Call # | Fund | Call Date | Due Date | My Amount | Paid | Status |
  |---|---|---|---|---|---|---|
  | #1 | Fund A | Sep 15 | Oct 15 | $250k | $250k | Paid ✓ |
  | #2 | Fund B | Nov 1 | Dec 15 | $100k | $50k | Pending ⏱️ |

Clicking row → `/lp-portal/capital-calls/[id]`

Empty State:
  [Icon] "No Capital Calls Yet"
```

---

**Tab 2: Distributions**

**Summary Section:**
```
Header with [View All] button → `/lp-portal/distributions`

Table if distributions exist:
  | Distribution # | Fund | Date | Source | My Amount | Status |
  |---|---|---|---|---|---|
  | #1 | Fund A | Sep 30 | CapGains | $15k | Completed ✓ |
  | #2 | Fund B | Scheduled | Returns | $25k | Pending ⏱️ |

Clicking row → `/lp-portal/distributions/[id]`

Empty State:
  [Icon] "No Distributions Yet"
```

---

### 8. Documents (`/lp-portal/documents`)

**Purpose:** Access fund-level and personal investor documents

**Page Layout:**

#### Header
```
Title: "Documents"
Subtitle: "Access fund documents and your personal investor documents"
```

#### Stats Cards (3 cards)
```
| Total Documents | Structure Documents | My Documents |
|---|---|---|
| N | M | K |
```

#### Filters Card
```
[Search box: "Search documents..."]
[Fund dropdown: All Funds, Fund 1, Fund 2, ...]
```

#### Tabbed View

**Tab 1: Structure Documents**

**Fund-Grouped Section Layout:**
```
Per Fund:
  [Building Icon] [Fund Name] [Badge: N documents]

  Per Document:
    [File Icon - colored by type]
    [Document Name] [Document Type Badge]
    [File Size] [Upload Date] [Uploaded By]
    [Eye Icon] [Download Icon]
```

**Document Types & Icons:**
- PDF: Red icon
- Excel: Green icon
- Word: Blue icon
- Generic: Gray icon

**Document Categories:**
- Quarterly Reports
- Annual Reports
- Limited Partnership Agreement
- Private Placement Memorandum
- NAV Reports
- K-1 Tax Forms
- Subscription Agreements
- Capital Call Notices
- Distribution Notices
- KYC Documentation

---

**Tab 2: My Documents**

Similar grouped layout, but filtered to:
- Documents where `investorName === currentInvestorName`
- K-1 Tax Forms (investor-specific)
- Subscription Agreements
- Capital Call/Distribution Notices (investor-specific)
- KYC Documentation

**Data Structure:**
```typescript
{
  id: string
  name: string
  type: string                // Financial Report, Legal Document, Tax Document, etc.
  category: string            // Structure Documents vs My Documents
  structureId: string
  structureName: string
  investorName?: string       // For personal documents
  size: string                // e.g., "2.4 MB"
  uploadedBy: string
  uploadedDate: string        // ISO format
  fileType: string            // pdf, excel, word
}
```

---

### 9. Account Settings (`/lp-portal/account`)

**Purpose:** Manage investor profile, preferences, and view associated funds

**Page Layout:**

#### Header
```
Title: "Account Settings"
Subtitle: "Manage your profile information and preferences"
```

#### Two-Column Grid

**Left Column: Profile Information Card**
```
[Avatar Image - 20x20 px]
[Change Photo Button - opens file input]
"JPG, PNG or GIF (max 5MB)"

---

[Full Name input field]
[Email input field]
[Phone Number input field]

[Save Changes Button]
```

**Right Column: Two Cards**

**Card 1: Language Preference**
```
Language Dropdown:
  ◯ English (default)
  ◯ Español

[Save Preference Button]
```

**Card 2: Change Password**
```
[Current Password input field]
[New Password input field]
"Must be at least 8 characters"
[Confirm New Password input field]

[Change Password Button]
```

---

#### Your Active Funds Section (if any)

**Grid of Active Structure Cards:**
```
Per Fund Card:
  Header:
    [Fund Name] [CheckCircle2 icon - green]
    Status: Active

  Content:
    Ownership: Y.YY%
    Commitment: $X
    Called Capital: $Y
    Current Value: $Z (green)
```

---

#### Pending Invitations Section (if any)

**Grid of Pending Structure Cards:**
```
Per Pending Card (yellow/warning styling):
  Header:
    [Fund Name] [Clock icon - yellow]
    Action Required

  Content:
    Status: [Badge - yellow] KYC/KYB, Contracts, Payments, etc.
    Commitment: $X

    [Continue Onboarding Button] → `/lp-portal/onboarding/[fundId]`
```

---

## Data Models

### Investor Model (from investors-storage.ts)

```typescript
interface Investor {
  id: string                    // UUID
  email: string                 // Unique identifier in LP Portal
  name: string
  type: string                  // individual, family-office, institution
  status: string                // Active, Pending, KYC/KYB, Contracts, Payments
  phone?: string
  fundOwnerships: FundOwnership[]

  // Extended fields for LP Portal
  avatarUrl?: string
  languagePreference?: string
}

interface FundOwnership {
  fundId: string
  fundName: string
  commitment: number
  calledCapital?: number
  currentValue?: number
  unrealizedGain?: number
  ownershipPercent?: number
  onboardingStatus?: string     // Active, KYC/KYB, Contracts, Payments, Pending
  investedDate?: string         // ISO date
  customTerms?: {               // Custom economic terms for this investor
    managementFee?: number
    performanceFee?: number
    preferredReturn?: number
    hurdleRate?: number
  }
}
```

### Capital Call Model (from capital-calls-storage.ts)

```typescript
interface CapitalCall {
  id: string                    // UUID
  fundId: string
  fundName: string
  callNumber: number
  callDate: string              // ISO date
  dueDate: string               // ISO date
  totalAmount: number
  currency: string              // USD, etc.
  description: string           // Purpose of capital call
  status: string                // Draft, Sent, Pending, Completed, Cancelled
  investorAllocations: InvestorAllocation[]
}

interface InvestorAllocation {
  investorId: string
  amountDue: number
  amountPaid: number            // Cumulative paid
  amountOutstanding: number     // amountDue - amountPaid
  status: string                // Draft, Sent, Pending, Paid, Overdue, Cancelled
  callAmount?: number           // Alternative field for amountDue
  paymentMethod?: string        // Bank Transfer / ACH, Credit Card, Crypto
  transactionReference?: string
  bankDetails?: string          // Last 4 digits, bank name
}
```

### Distribution Model (from distributions-storage.ts)

```typescript
interface Distribution {
  id: string                    // UUID
  fundId: string
  fundName: string
  distributionNumber: number
  distributionDate: string      // ISO date
  source: string                // Proceeds, Dividends, Returns, etc.
  totalDistributionAmount: number
  currency: string
  purpose?: string
  status: string                // Pending, Processing, Completed, Failed
  investorAllocations: DistributionAllocation[]
}

interface DistributionAllocation {
  investorId: string
  capitalContributed: number    // Original capital paid
  capitalReturned: number       // Return of capital portion
  preferredReturn: number       // Preferred return portion
  carryAllocation: number       // Carried interest allocation
  finalAllocation: number       // Total distribution to investor
  status: string                // Pending, Processing, Completed, Failed
}
```

### Structure/Fund Model (from structures-storage.ts)

```typescript
interface Structure {
  id: string
  name: string
  type: string                  // Fund, SPV, Trust, etc.
  subtype: string               // Real Estate Fund, PE Fund, etc.
  status: string                // Active, Pending, Closed
  jurisdiction: string          // US, Mexico, Guatemala, etc.
  currency: string              // USD, MXN, GTQ, etc.
  totalCommitment: number       // Sum of all investor commitments
  createdDate: string           // ISO date
  inceptionDate?: string        // Fund inception date
  fundTerm?: string             // e.g., "10 years"
  fundType?: string

  // Economic terms
  managementFee?: number        // Annual % (e.g., 2)
  performanceFee?: number       // Carry % (e.g., 20)
  preferredReturn?: number      // % per annum (e.g., 8)
  hurdleRate?: number           // % per annum

  // Capital call settings
  capitalCallNoticePeriod?: number  // Days of notice required
  capitalCallPaymentDeadline?: number // Days to pay after notice

  // Distribution settings
  waterfallStructure?: string   // American, European, Hybrid
  distributionFrequency?: string // Quarterly, Monthly, Annual

  // Investment capacity
  plannedInvestments?: number
  minCheckSize?: number
  maxCheckSize?: number

  // Legal terms
  legalTerms?: {
    managementControl?: string
    capitalContributions?: string
    allocationsDistributions?: string
    limitedPartnerRights?: string[]
    limitedPartnerObligations?: string[]
    votingRights?: {
      votingThreshold?: number   // %
      mattersRequiringConsent?: string[]
    }
    redemptionTerms?: {
      lockUpPeriod?: string
      withdrawalConditions?: string[]
      withdrawalProcess?: string[]
    }
    transferRestrictions?: {
      generalProhibition?: string
      permittedTransfers?: string[]
      transferRequirements?: string[]
    }
    reportingCommitments?: {
      quarterlyReports?: string
      annualReports?: string
      taxForms?: string
      capitalNotices?: string
      additionalCommunications?: string[]
    }
    liabilityLimitations?: {
      limitedLiabilityProtection?: string
      exceptionsToLimitedLiability?: string[]
      maximumExposureNote?: string
    }
    indemnification?: {
      partnershipIndemnifiesLPFor?: string[]
      lpIndemnifiesPartnershipFor?: string[]
      indemnificationProcedures?: string
    }
  }
}
```

---

## Workflows

### Capital Call Workflow

```
1. Fund Manager Creates Capital Call (Investment Manager)
   → Capital call stored with investor allocations

2. LP Sees Pending Capital Call
   → `/lp-portal/capital-calls` shows call in grid
   → Card shows "Pending" status

3. LP Views Details (Optional)
   → `/lp-portal/capital-calls/[id]/summary` shows breakdown

4. LP Initiates Payment
   → Click "Pay Now" button
   → Navigate to `/lp-portal/capital-calls/[id]/payment`

5. LP Selects Payment Method
   → Bank Account (ACH): Fill in bank details
   → Credit Card: Redirect to Stripe
   → Crypto: Redirect to crypto provider

6. LP Submits Payment
   → Bank: updateInvestorPayment() updates amountPaid
   → Status changes to "Paid"
   → Redirect to `/lp-portal/capital-calls` with confirmation

7. LP Can View Paid Call
   → Shows "Paid" status
   → Displays [View Details] instead of [Pay Now]

8. Activity Summary Updated
   → `/lp-portal/activity` shows in Capital Calls tab
   → Totals updated: totalPaid, totalOutstanding, netCashPosition
```

### Distribution Workflow

```
1. Fund Manager Creates Distribution (Investment Manager)
   → Distribution record created with investor allocations

2. LP Sees Distribution
   → `/lp-portal/dashboard` includes in total distributed
   → `/lp-portal/activity` shows in Distributions tab

3. LP Views Distribution Details (Optional)
   → `/lp-portal/distributions/[id]` shows breakdown
   → Tiers: Capital Return, Preferred Return, Carried Interest

4. Distribution Processed
   → Status changes from Pending → Completed
   → Funds transferred to LP bank account

5. Activity Summary Updated
   → Total Distributed updated
   → Net Cash Position recalculated
```

### Fund Commitment Lifecycle

```
1. Investor Invited
   → Added to structure's fundOwnerships
   → Status: Pending (onboardingStatus not set)

2. Investor Begins Onboarding
   → `/lp-portal/onboarding/[fundId]` (not yet built)
   → Completes KYC/KYB, signs contracts, etc.

3. Investor Sets Commitment
   → Specifies capital commitment amount
   → Updates fundOwnership.commitment

4. Investor Completes Onboarding
   → All steps finished (KYC, contracts, payments)
   → Status changes to "Active"

5. Capital Calls Begin
   → Capital Call created with investor allocation
   → Investor receives call notice

6. Investor Funds Commitment
   → Pays capital calls as requested
   → amountPaid accumulates toward total commitment

7. Commitment Fully Called
   → Sum of amountPaid = commitment amount
   → Progress bar reaches 100%

8. Investor Receives Distributions
   → Distributions allocated per waterfall
   → Can withdraw remaining capital at fund end
```

---

## Components & Storage

### LP Portal Components

**Location:** `src/components/`

```
lp-sidebar-wrapper.tsx         // Sidebar navigation
lp-header.tsx                  // Header with breadcrumbs/user info
lp-chart-builder-dialog.tsx    // Modal for adding/editing widgets
ProtectedRoute.tsx             // Route protection wrapper
```

### LP Portal Storage Libraries

**Location:** `src/lib/`

```
lp-dashboard-storage.ts        // Widget CRUD and ordering
  - getDashboardConfig()       // Get all widgets + order
  - addWidget()                // Add custom widget
  - removeWidget()             // Remove widget
  - reorderWidgets()           // Update order
  - updateWidget()             // Edit existing widget

lp-portal-helpers.ts           // Data fetching for LP portal
  - getInvestorByEmail()
  - getCurrentInvestorEmail()
  - getInvestorStructures()    // Get investor's active structures
  - getInvestorCapitalCalls()  // Get investor's capital calls
  - getInvestorDistributions() // Get investor's distributions
  - getPendingInvitations()    // Get pending fund invitations
  - getInvestorAvatar()        // Get avatar image
  - setInvestorAvatar()        // Save avatar image

lp-metric-calculations.ts      // Calculate LP-specific metrics
  - calculateLPMetric()        // Calculate single metric

lp-metric-templates.ts         // Predefined metric templates
  - lpMetricTemplates          // Array of metric definitions
  - lpMetricCategories         // Category grouping
  - getMetricsByCategory()     // Filter by category

lp-chart-templates.ts          // Predefined chart templates
  - lpChartTemplates           // Array of chart configs
  - lpChartCategories          // Category grouping
  - getTemplatesByCategory()   // Filter by category
```

### Existing Storage (Used by LP Portal)

```
structures-storage.ts
  - getStructures()            // All structures
  - getStructureById()         // Single structure

investors-storage.ts
  - getInvestors()
  - getInvestorByEmail()
  - updateInvestor()           // Update profile
  - getInvestors()

capital-calls-storage.ts
  - getCapitalCalls()
  - updateInvestorPayment()    // Mark capital call paid

distributions-storage.ts
  - getDistributions()         // Get all distributions
  - getDistributionById()      // Single distribution

investments-storage.ts
  - getInvestments()           // Get all investments
```

---

## Calculation Rules

### Capital Deployment Metrics

```typescript
const totalCommitment = structures.reduce((sum, s) => sum + s.commitment, 0)
const totalCalledCapital = structures.reduce((sum, s) => sum + s.calledCapital, 0)
const totalUncalledCapital = totalCommitment - totalCalledCapital
const deploymentRate = totalCommitment > 0
  ? (totalCalledCapital / totalCommitment) * 100
  : 0
```

### Investor Ownership

```typescript
// Calculated from called capital vs fund size (NOT from commitment)
const ownershipPercent = totalFundSize > 0
  ? (investorCalledCapital / totalFundSize) * 100
  : 0
```

### Performance Metrics (Per Structure)

```typescript
const tvpi = calledCapital > 0
  ? (totalDistributed + currentValue) / calledCapital
  : 0

const dpi = calledCapital > 0
  ? totalDistributed / calledCapital
  : 0

const rvpi = calledCapital > 0
  ? currentValue / calledCapital
  : 0

const moic = tvpi  // Same as TVPI in simple model

// IRR: Mock calculation (would need actual cash flow dates in production)
const irr = calledCapital > 0
  ? ((currentValue + totalDistributed - calledCapital) / calledCapital) * 15
  : 0
```

### Called Capital Calculation

```typescript
// From capital call payments (actual data)
const fundCapitalCalls = allCapitalCalls.filter(cc => cc.fundId === fundId)
const investorAllocations = fundCapitalCalls
  .map(cc => cc.investorAllocations.find(alloc => alloc.investorId === investorId))
  .filter(alloc => alloc !== undefined)

const calledCapital = investorAllocations.reduce((sum, alloc) =>
  sum + (alloc?.amountPaid || 0), 0)
```

### Total Distributed Calculation

```typescript
// From distribution records (actual data)
const allDistributions = getDistributions()
const investorDistributions = allDistributions.filter(dist =>
  dist.investorAllocations.some(alloc => alloc.investorId === investorId)
)

const totalDistributed = investorDistributions
  .filter(dist => dist.status === 'Completed')  // Only completed
  .reduce((sum, dist) => {
    const allocation = dist.investorAllocations.find(
      alloc => alloc.investorId === investorId
    )
    return sum + (allocation?.finalAllocation || 0)
  }, 0)
```

### Capital Call Status Logic

```typescript
const isOverdue = (dueDate: string, status: string) => {
  return new Date(dueDate) < new Date() &&
         status !== 'Paid' &&
         status !== 'Cancelled'
}

// In capital call cards, if overdue:
// Display badge as "Overdue" regardless of investorAllocation.status
```

### Net Cash Position

```typescript
// Net = distributions received minus capital paid
const netCashPosition = totalDistributed - totalPaidCapital

// Positive: investor has received more than paid (net gain)
// Negative: investor has paid more than received (net invested)
```

---

## Key Implementation Notes

### Data Refresh Strategy

LP Portal components use multiple refresh mechanisms:

1. **localStorage Events:**
   ```typescript
   window.addEventListener('storage', (e) => {
     if (e.key === 'polibit_investors' || e.key === 'polibit_structures') {
       setRefreshKey(prev => prev + 1)
     }
   })
   ```

2. **Window Focus:**
   ```typescript
   window.addEventListener('focus', () => {
     setRefreshKey(prev => prev + 1)
   })
   ```

3. **Visibility Change:**
   ```typescript
   document.addEventListener('visibilitychange', () => {
     if (document.visibilityState === 'visible') {
       loadData()
     }
   })
   ```

### Async Dynamic Routes

All `/lp-portal/portfolio/[structureId]` and `/lp-portal/capital-calls/[id]` pages use:

```typescript
interface Props {
  params: Promise<{ structureId: string | id: string }>
}

export default function Page({ params }: Props) {
  const { structureId | id } = use(params)  // Unwrap Promise
  // ...
}
```

### Investor Session Management

Current investor tracked via localStorage:
```typescript
localStorage.setItem('polibit_current_investor_email', email)
const email = localStorage.getItem('polibit_current_investor_email')
```

All LP Portal pages pull investor data via this email.

### Widget Persistence

Dashboard widget state persists to localStorage:
```typescript
// Storage key: 'polibit_lp_dashboard_config'
interface DashboardConfig {
  widgets: DashboardWidget[]  // Ordered array
}

interface DashboardWidget {
  id: string                  // Unique identifier
  type: string                // 'metric', 'chart', 'card', 'section'
  config?: any                // Type-specific configuration
  ignoreFilter?: boolean      // Skip global fund filter
}
```

---

## Future Enhancements

1. **Real-time Updates:** WebSocket connections for live capital call notifications
2. **Advanced Reporting:** Custom report builder with saved templates
3. **Mobile App:** Native iOS/Android applications
4. **Email Notifications:** Capital calls, distributions, document uploads
5. **Multi-language Support:** Full i18n for Spanish, Portuguese
6. **Two-Factor Authentication:** Enhanced security
7. **Activity Feed:** Notification center for all investor events
8. **Waterfall Simulation:** "What-if" analysis tool
9. **Tax Optimization:** Tax planning insights
10. **Integration with Accounting Software:** QuickBooks, Xero sync

---

**Document Version:** 1.0
**Scope:** Complete LP Portal specification including all 10+ major sections
**Status:** Ready for implementation/Phase 2 development
