# Investment Manager - Database Relationship Diagram

This document shows all foreign key relationships and entity connections in the Investment Manager system.

## Core Entity Relationships

```
┌─────────────────┐
│     USERS       │
│   (id: UUID)    │
└────────┬────────┘
         │
         │ created_by
         ├────────────────────────────────────────────────────────┐
         │                                                        │
         │                                                        │
    ┌────▼──────────┐         ┌─────────────────┐         ┌────▼──────────┐
    │  STRUCTURES   │         │   INVESTORS     │         │  INVESTMENTS  │
    │  (id: UUID)   │         │   (id: UUID)    │         │  (id: UUID)   │
    │               │         │                 │         │               │
    │ • name        │         │ • investor_type │         │ • type        │
    │ • type        │         │ • email         │         │ • status      │
    │ • status      │         │ • kyc_status    │         │               │
    │ • hierarchy   │         │                 │         └───────────────┘
    └───────┬───────┘         └─────────────────┘
            │                         │
            │                         │
            │ parent_structure_id     │
            │ (self-referencing)      │
            │                         │
    ┌───────▼───────────────────────┐│
    │  Hierarchical Structure Tree  ││
    │  (up to 5 levels)            ││
    └───────────────────────────────┘│
            │                         │
            │                         │
            └────────┬────────────────┘
                     │
                     │
         ┌───────────▼────────────┐
         │  STRUCTURE_INVESTORS   │
         │  (Junction Table)      │
         │                        │
         │ • structure_id (FK)    │
         │ • investor_id (FK)     │
         │ • commitment_amount    │
         │ • ownership_percent    │
         │ • custom_terms         │
         └────────────────────────┘
```

## Investment & Project Relationships

```
┌─────────────────┐
│   STRUCTURES    │
│   (id: UUID)    │
└────────┬────────┘
         │
         │ structure_id
         │
    ┌────▼──────────┐         ┌─────────────────┐
    │  INVESTMENTS  │────────▶│    PROJECTS     │
    │  (id: UUID)   │  FK     │   (id: UUID)    │
    │               │         │                 │
    │ • structure_id│         │ • name          │
    │ • project_id  │         │ • status        │
    │ • type        │         │ • available     │
    │ • status      │         │                 │
    │               │         └─────────────────┘
    │ EQUITY:       │
    │ • invested    │
    │ • ownership%  │
    │ • current_val │
    │               │
    │ DEBT:         │
    │ • principal   │
    │ • interest%   │
    │ • repaid      │
    │               │
    │ METRICS:      │
    │ • IRR%        │
    │ • MOIC        │
    └───────────────┘
```

## Capital Calls Flow

```
┌─────────────────┐
│   STRUCTURES    │
│   (id: UUID)    │
└────────┬────────┘
         │
         │ structure_id
         │
    ┌────▼──────────────┐
    │  CAPITAL_CALLS    │
    │  (id: UUID)       │
    │                   │
    │ • structure_id    │
    │ • call_number     │
    │ • call_date       │
    │ • due_date        │
    │ • total_amount    │
    │ • status          │
    └────────┬──────────┘
             │
             │ capital_call_id
             │
    ┌────────▼────────────────────┐
    │ CAPITAL_CALL_ALLOCATIONS    │
    │ (Junction Table)            │
    │                             │
    │ • capital_call_id (FK)      │
    │ • investor_id (FK)          │
    │ • allocated_amount          │
    │ • paid_amount               │
    │ • remaining_amount          │
    │ • status                    │
    │ • payment_date              │
    └──────────┬──────────────────┘
               │
               │ investor_id
               │
    ┌──────────▼──────────┐
    │     INVESTORS       │
    │     (id: UUID)      │
    └─────────────────────┘
```

## Distributions & Waterfall Flow

```
┌─────────────────┐
│   STRUCTURES    │
│   (id: UUID)    │
└────┬───────┬────┘
     │       │
     │       │ structure_id
     │       │
     │  ┌────▼────────────────┐
     │  │  WATERFALL_TIERS    │
     │  │  (id: UUID)         │
     │  │                     │
     │  │ • structure_id (FK) │
     │  │ • tier_number (1-4) │
     │  │ • lp_share_%        │
     │  │ • gp_share_%        │
     │  │ • threshold_irr     │
     │  │ • threshold_amount  │
     │  │                     │
     │  │ Tier 1: Return Cap  │
     │  │ Tier 2: Pref Return │
     │  │ Tier 3: GP Catch-up │
     │  │ Tier 4: Carried Int │
     │  └─────────────────────┘
     │
     │ structure_id
     │
┌────▼──────────────┐
│  DISTRIBUTIONS    │
│  (id: UUID)       │
│                   │
│ • structure_id    │
│ • dist_number     │
│ • dist_date       │
│ • total_amount    │
│ • status          │
│                   │
│ SOURCE:           │
│ • equity_gain     │
│ • debt_interest   │
│ • debt_principal  │
│ • other           │
│                   │
│ WATERFALL:        │
│ • applied?        │
│ • tier1_amount    │
│ • tier2_amount    │
│ • tier3_amount    │
│ • tier4_amount    │
│                   │
│ SPLIT:            │
│ • lp_total        │
│ • gp_total        │
│ • mgmt_fee        │
└────────┬──────────┘
         │
         │ distribution_id
         │
┌────────▼────────────────────┐
│ DISTRIBUTION_ALLOCATIONS    │
│ (Junction Table)            │
│                             │
│ • distribution_id (FK)      │
│ • investor_id (FK)          │
│ • allocated_amount          │
│ • paid_amount               │
│ • status                    │
│ • payment_date              │
└──────────┬──────────────────┘
           │
           │ investor_id
           │
┌──────────▼──────────┐
│     INVESTORS       │
│     (id: UUID)      │
└─────────────────────┘
```

## Document Management (Polymorphic)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   STRUCTURES    │    │   INVESTORS     │    │  INVESTMENTS    │
│   (id: UUID)    │    │   (id: UUID)    │    │  (id: UUID)     │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                       │
         │                      │                       │
         └──────────────────────┼───────────────────────┘
                                │
                  entity_type + entity_id (Polymorphic)
                                │
                    ┌───────────▼────────────┐
                    │     DOCUMENTS          │
                    │     (id: UUID)         │
                    │                        │
                    │ • entity_type (ENUM)   │
                    │   - Structure          │
                    │   - Investor           │
                    │   - Investment         │
                    │   - CapitalCall        │
                    │   - Distribution       │
                    │                        │
                    │ • entity_id (UUID)     │
                    │ • document_type        │
                    │ • document_name        │
                    │ • file_path            │
                    │ • version              │
                    │ • is_active            │
                    │ • tags (JSONB)         │
                    │ • metadata (JSONB)     │
                    └────────────────────────┘
         │                      │                       │
         │                      │                       │
┌────────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐
│ CAPITAL_CALLS   │    │ DISTRIBUTIONS   │    │    PROJECTS     │
│   (id: UUID)    │    │   (id: UUID)    │    │   (id: UUID)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Complete Entity Relationship Summary

### Primary Entities

1. **USERS** (uuid)
   - Root entity - all entities have user_id FK

2. **STRUCTURES** (uuid)
   - parent_structure_id → structures.id (self-referencing, nullable)
   - user_id → users.id
   - Supports 5-level hierarchy

3. **INVESTORS** (uuid)
   - user_id → users.id
   - Polymorphic type: Individual, Institution, FOF, Family Office

4. **INVESTMENTS** (uuid)
   - structure_id → structures.id
   - project_id → projects.id (nullable)
   - user_id → users.id

5. **CAPITAL_CALLS** (uuid)
   - structure_id → structures.id
   - investment_id → investments.id (nullable)
   - user_id → users.id

6. **DISTRIBUTIONS** (uuid)
   - structure_id → structures.id
   - investment_id → investments.id (nullable)
   - user_id → users.id

7. **WATERFALL_TIERS** (uuid)
   - structure_id → structures.id
   - user_id → users.id

8. **DOCUMENTS** (uuid)
   - entity_type (ENUM) + entity_id (UUID) - Polymorphic
   - uploaded_by → users.id
   - user_id → users.id

### Junction Tables

9. **STRUCTURE_INVESTORS** (uuid)
   - structure_id → structures.id
   - investor_id → investors.id
   - Stores: commitment, ownership%, custom terms

10. **CAPITAL_CALL_ALLOCATIONS** (uuid)
    - capital_call_id → capital_calls.id
    - investor_id → investors.id
    - Stores: allocated, paid, remaining amounts

11. **DISTRIBUTION_ALLOCATIONS** (uuid)
    - distribution_id → distributions.id
    - investor_id → investors.id
    - Stores: allocated, paid amounts

## Cascade Delete Rules

All foreign keys implement `ON DELETE CASCADE`:

- Deleting a Structure → deletes all child structures, investments, capital calls, distributions, waterfall tiers
- Deleting an Investor → deletes all structure_investors, allocations
- Deleting a Capital Call → deletes all capital_call_allocations
- Deleting a Distribution → deletes all distribution_allocations

## Key Indexes

Performance indexes created on:
- structure_investors(structure_id, investor_id)
- capital_call_allocations(capital_call_id, investor_id)
- distribution_allocations(distribution_id, investor_id)
- documents(entity_type, entity_id)
- investments(structure_id, project_id)
- waterfall_tiers(structure_id, tier_number)

## Data Integrity Constraints

1. **Structures**: hierarchy_level CHECK (1-5)
2. **Investors**: investor_type CHECK (Individual, Institution, Fund of Funds, Family Office)
3. **Investments**: investment_type CHECK (EQUITY, DEBT, MIXED)
4. **Capital Calls**: status CHECK (Draft, Sent, Partially Paid, Paid)
5. **Distributions**: status CHECK (Draft, Pending, Paid)
6. **Waterfall Tiers**: tier_number CHECK (1-4)
7. **Documents**: entity_type CHECK (Structure, Investor, Investment, CapitalCall, Distribution)

## Relationship Cardinalities

- User → Structures: **1:N**
- User → Investors: **1:N**
- Structure → Investments: **1:N**
- Structure → Capital Calls: **1:N**
- Structure → Distributions: **1:N**
- Structure → Waterfall Tiers: **1:N** (max 4)
- Structure → Structure (parent): **1:N** (hierarchical)
- Structure ↔ Investors: **N:M** (via structure_investors)
- Capital Call → Investors: **1:N** (via allocations)
- Distribution → Investors: **1:N** (via allocations)
- Investment → Project: **N:1** (optional)
- Document → Any Entity: **N:1** (polymorphic)
