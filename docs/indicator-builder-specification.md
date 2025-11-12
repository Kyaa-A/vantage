# Indicator Builder Implementation Plan & Specification

**Version**: 1.4
**Last Updated**: 2025-11-12 (November 12, 2025)
**Status**: Validation Complete - 29 Indicators Validated
**Purpose**: Source of truth for indicator builder system implementation

---

## Document Purpose

This document serves as the **source of truth** for the indicator builder system. It will be iteratively updated as we validate against real SGLGB indicators to ensure our implementation can handle all required scenarios.

### Validation Process
1. Present a real indicator example
2. Check if current plan can build this indicator
3. If YES → Move to next indicator
4. If NO → Update plan to accommodate the indicator
5. Repeat until all indicator patterns are covered

---

## Current Understanding (Based on Real Examples)

### Barangay-Based Institutions (BBIs)

The SGLGB assessment framework includes evaluation of mandatory **Barangay-Based Institutions (BBIs)** that serve as organizational structures for local governance. These BBIs are legislated bodies that each barangay must establish and maintain:

**List of BBIs:**
1. **BDRRMC** - Barangay Disaster Risk Reduction and Management Committee
2. **BADAC** - Barangay Anti-Drug Abuse Council
3. **BPOC** - Barangay Peace and Order Committee
4. **Lupong Tagapamayapa (LT)** - Barangay Justice System
5. **Barangay Violence Against Women (VAW) Desk**
6. **BDC** - Barangay Development Council
7. **BCPC** - Barangay Council for the Protection of Children
8. **Barangay Nutrition Committee (BNC)**
9. **BESWMC** - Barangay Ecological Solid Waste Management Committee

**BBI Functionality Assessment:**
- Each BBI has an associated indicator that evaluates its **functionality** (e.g., 2.1 for BDRRMC, 3.1 for BADAC)
- BBI functionality is checked through organizational structure, meetings, plans, trainings, and accomplishment reports
- Many BBIs follow a common pattern:
  - **Structure**: EO/ordinance establishing the committee with proper composition
  - **Plan**: Approved annual work and financial plan
  - **Accomplishment Reports**: With OR logic for physical (≥50% target completion) OR financial (≥50% budget utilization)
  - **Additional Requirements**: Specific to each BBI's mandate

**BBI Functionality Status:**
- Each BBI's functionality status is **DETERMINED BY** its associated indicator's pass/fail result
- **Direction of Relationship**: Indicator result → BBI status (NOT BBI status → affects other indicators)
- **Example**: If indicator 2.1 (BDRRMC Functionality) **PASSES** → BDRRMC is marked as **"Functional"** in the system
- **Example**: If indicator 4.3 (BDC Functionality) **FAILS** → BDC is marked as **"Non-Functional"** in the system
- **No Cross-References**: BBIs are standalone - no indicators outside the 9 BBI functionality indicators check or reference BBI status
- **Implementation Note**: System must track and store BBI functionality status based on the associated indicator's validation result

**BBI-to-Indicator Mapping** (Primary Functionality Indicators):
Each BBI has ONE dedicated functionality assessment indicator:

| BBI | Governance Area | Indicator |
|-----|-----------------|-----------|
| **BDRRMC** | Core 2: Disaster Preparedness | 2.1 Functionality of BDRRMC |
| **BADAC** | Core 3: Safety, Peace and Order | 3.1 Functionality of BADAC |
| **BPOC** | Core 3: Safety, Peace and Order | 3.2 Functionality of BPOC |
| **Lupong Tagapamayapa (LT)** | Core 3: Safety, Peace and Order | 3.3 Functionality of LT |
| **VAW Desk** | Essential 1: Social Protection | 4.1 Functionality of VAW Desk |
| **BDC** | Essential 1: Social Protection | 4.3 Functionality of BDC |
| **BCPC** | Essential 1: Social Protection | 4.5 Functionality of BCPC |
| **BNC** | Essential 1: Social Protection | 4.8 Functionality of BNC |
| **BESWMC** | Essential 3: Environmental Management | 6.1 Functionality of BESWMC |

**Note**: BBIs are standalone - each BBI is only assessed by its dedicated functionality indicator. No indicators cross-reference other BBI statuses.

---

### Understanding "Cross-References" and BBIs

#### What Does "Cross-Reference" Mean?

A **cross-reference** means one indicator **checking or looking at** another indicator's result (or a BBI's status) to determine its own validation outcome.

#### Two Possible Scenarios

**❌ SCENARIO A: With Cross-References (NOT what we have)**
```
Example if we HAD cross-references:

Indicator 1.1 (BFDP Compliance) validates:
  ├─ Check all required documents ✓
  ├─ Check photo count ✓
  └─ CHECK: Is BDC functional? ← CROSS-REFERENCE
      ├─ If BDC is Functional → Indicator 1.1 can PASS
      └─ If BDC is Non-Functional → Indicator 1.1 automatically FAILS

In this scenario:
- Indicator 1.1 "looks at" BDC's status
- BDC's status AFFECTS Indicator 1.1's result
- This is a CROSS-REFERENCE relationship
```

**✅ SCENARIO B: NO Cross-References (what we actually have)**
```
What we actually have:

Indicator 1.1 (BFDP Compliance) validates:
  ├─ Check all required documents ✓
  ├─ Check photo count ✓
  └─ Result: PASS or FAIL
      (Does NOT check BDC or any other BBI status)

Indicator 4.3 (BDC Functionality) validates:
  ├─ Check BDC structure ✓
  ├─ Check BDC plan ✓
  ├─ Check accomplishment reports ✓
  └─ Result: PASS or FAIL
      └─ If PASS → System marks "BDC is Functional" in database
      └─ If FAIL → System marks "BDC is Non-Functional" in database

No indicator checks whether BDC is functional.
BDC's status is just stored in the system but not used by other indicators.
```

#### Visual Diagram: Current BBI System (No Cross-References)

```
┌─────────────────────────────────────────────────────────────┐
│                    ASSESSMENT CYCLE                          │
└─────────────────────────────────────────────────────────────┘

Governance Area 1: Good Governance
├─ Indicator 1.1 (BFDP Compliance)
│   └─ Validates: Documents, photos
│   └─ Result: PASS/FAIL ────────┐
│                                  │
├─ Indicator 1.2 (Revenue Gen)    │
│   └─ Validates: Revenue data    │    NO CONNECTIONS
│   └─ Result: PASS/FAIL ────────┤    BETWEEN THESE
│                                  │
├─ Indicator 1.3 (Budget)         │
│   └─ Validates: Budget docs     │
│   └─ Result: PASS/FAIL ────────┘
│
│   (These indicators DO NOT check BBI status)
│
└─────────────────────────────────────────────────────────────

Governance Area 4: Social Protection
├─ Indicator 4.3 (BDC Functionality) ← BBI FUNCTIONALITY INDICATOR
│   └─ Validates: Structure, Plan, Reports
│   └─ Result: PASS/FAIL
│         │
│         ├─ If PASS ──→ Update Database: BDC = "Functional"
│         └─ If FAIL ──→ Update Database: BDC = "Non-Functional"
│
│   Direction: Indicator Result → BBI Status (one-way)
│
└─────────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────┐
│                DATABASE: bbi_barangay_status                 │
├─────────────────────────────────────────────────────────────┤
│  Barangay Poblacion 1:                                       │
│    - BDRRMC: Functional   (set by indicator 2.1 result)     │
│    - BADAC: Functional    (set by indicator 3.1 result)     │
│    - BDC: Non-Functional  (set by indicator 4.3 result) ← STORED
│                                                               │
│  This data is STORED but NOT USED by other indicators       │
│  (May be used for reporting/analytics only)                 │
└─────────────────────────────────────────────────────────────┘
```

#### Concrete Examples

**Example 1: Indicator 1.1 (BFDP Compliance)**

```python
# Validation logic for Indicator 1.1
def validate_indicator_1_1(responses):
    # Check documents
    all_documents_uploaded = check_documents(responses)

    # Check photo count
    photo_count_valid = check_photo_count(responses, min_count=2)

    # Determine result
    if all_documents_uploaded and photo_count_valid:
        return "PASSED"
    else:
        return "FAILED"

    # NOTE: We DO NOT check BDC status here!
    # BDC's functionality is irrelevant to this indicator.
```

**Example 2: Indicator 4.3 (BDC Functionality)**

```python
# Validation logic for Indicator 4.3
def validate_indicator_4_3(responses):
    # Validate BDC requirements
    structure_valid = check_bdc_structure(responses)
    plan_valid = check_bdc_plan(responses)
    reports_valid = check_bdc_accomplishments(responses)

    # Determine result
    if structure_valid and plan_valid and reports_valid:
        indicator_result = "PASSED"
    else:
        indicator_result = "FAILED"

    # AFTER validation, update BDC status for this barangay
    update_bbi_status(
        bbi_code="BDC",
        barangay_id=barangay_id,
        is_functional=(indicator_result == "PASSED")
    )

    return indicator_result
```

**Example 3: If We HAD Cross-References (but we don't!)**

```python
# THIS IS NOT WHAT WE DO - JUST AN EXAMPLE OF CROSS-REFERENCE
def validate_indicator_1_1_with_cross_reference(responses, barangay_id):
    # Check documents
    all_documents_uploaded = check_documents(responses)
    photo_count_valid = check_photo_count(responses, min_count=2)

    # ❌ Cross-reference: Check if BDC is functional
    bdc_status = get_bbi_status("BDC", barangay_id)

    if all_documents_uploaded and photo_count_valid and bdc_status.is_functional:
        return "PASSED"
    elif not bdc_status.is_functional:
        return "FAILED", "BDC is non-functional"  # BDC status affects result
    else:
        return "FAILED"

# WE DO NOT DO THIS IN THE VANTAGE SYSTEM!
```

#### Summary: What "No Cross-References" Means

| Aspect | With Cross-References ❌ | Without Cross-References ✅ (Our System) |
|--------|-------------------------|----------------------------------------|
| **Indicator 1.1** | Checks if BDC is functional | Does NOT check BDC status |
| **Indicator 4.3** | Determines BDC functionality | Determines BDC functionality |
| **BDC Status** | AFFECTS other indicators | DOES NOT affect other indicators |
| **Data Flow** | Indicator 4.3 → BDC status → Affects Indicator 1.1 | Indicator 4.3 → BDC status (stored only) |
| **Usage of BBI Status** | Used for validation by multiple indicators | Stored for reporting/analytics only |

#### Key Takeaway

**In the VANTAGE system:**
- Each indicator validates independently
- BBI functionality indicators (2.1, 3.1, 3.2, 3.3, 4.1, 4.3, 4.5, 4.8, 6.1) determine their BBI's status
- That BBI status is **stored in the database**
- But **no other indicators check or use that BBI status** for their validation
- BBI status may be used for **reporting, analytics, or display purposes only**

**We say "No Cross-References" because:**
- Indicator 1.1 doesn't look at BDC status
- Indicator 1.2 doesn't look at BDC status
- NO indicator outside of 4.3 checks whether BDC is functional
- Each indicator is **self-contained** in its validation logic

---

### Validated Indicator Examples

#### ✅ Example 1: Indicator 1.1 - BFDP Compliance (3-level hierarchy)
```
1.1 Compliance with the Barangay Full Disclosure Policy (BFDP)
├── 1.1.1 Posted CY 2023 financial documents in BFDP board
│   └── MOV Checklist (18 items in groups):
│       ├── BFDP Monitoring Form A (single item)
│       ├── Two (2) Photo Documentation (requires count: min 2)
│       ├── ANNUAL REPORT (group with 5 items)
│       │   ├── a. Barangay Financial Report
│       │   ├── b. Barangay Budget
│       │   ├── c. Summary of Income and Expenditures
│       │   ├── d. 20% Component of NTA Utilization
│       │   └── e. Annual Procurement Plan or Procurement List
│       ├── QUARTERLY REPORT (group with 1 item)
│       │   └── f. List of Notices of Award (1st-3rd Quarter)
│       └── MONTHLY REPORT (group with 1 item)
│           └── g. Itemized Monthly Collections and Disbursements
│
│   └── Validation Logic:
│       - All required items must be checked
│       - Photo count must be >= 2
│       - All groups must be complete
│       - Result: PASS/FAIL
│
└── 1.1.2 Accomplished and signed BFR with received stamp
    └── MOV Checklist (1 item):
        └── Annex B of DBM-DOF-DILG JMC No. 2018-1

    └── Validation Logic:
        - Checkbox must be verified
        - Result: PASS/FAIL

Aggregation: Indicator 1.1 PASSES if BOTH 1.1.1 AND 1.1.2 PASS
```

**Key Learnings**:
- MOV checklists can have **grouped items** (ANNUAL REPORT, QUARTERLY REPORT, etc.)
- Some items require **document counts** (e.g., "Two (2) photos")
- Hierarchical structure allows up to 4 levels (1, 1.1, 1.1.1, 1.1.1.1)
- Each sub-indicator must pass for the parent indicator to pass (ALL logic)

#### ✅ Example 2: Indicator 1.2 - Innovations on Revenue Generation
```
1.2 The barangay showed innovations on revenue generation
└── MOV Checklist (2 input fields with comparison validation):
    ├── CY 2022 Average Monthly Revenue (currency input)
    │   └── Field: currency, required, placeholder: "₱0.00"
    │
    └── CY 2023 Average Monthly Revenue (currency input)
        └── Field: currency, required, placeholder: "₱0.00"
        └── Validation: Must be greater than CY 2022 (shows warning if not)

Validation Logic:
- Validator enters revenue amounts for both years
- System validates that CY 2023 > CY 2022 (increase in revenue)
- If validation fails: Show warning but allow override with justification
- BLGU role: Only uploads supporting documents, does NOT enter amounts
```

**Key Learnings**:
- MOV checklists can include **data input fields** (not just checkboxes)
- Input types: **currency**, **number**, **text**, **date**
- Fields can have **comparison validation** (e.g., field A > field B)
- Validation failures show **warnings but allow manual override**
- **BLGU users only upload files**; validators enter data in input fields
- Input fields require **validation rules** (min/max, comparison operators)

#### ✅ Example 3: Indicator 1.3.1 - Barangay Budget Approval (Mixed Types + Date Validation)
```
1.3.1 Presence of a Barangay Appropriation Ordinance approved on or before December 31, 2022
└── MOV Checklist (1 checkbox + 1 date input with deadline validation):
    ├── Approved Barangay Appropriation Ordinance signed by SBMs, SK Chairperson,
    │   Barangay Secretary, and Punong Barangay (checkbox)
    │
    └── Date of Approval (date input with deadline validation)
        └── Validation Logic:
            - If date <= December 31, 2022 → Result: "PASSED"
            - If date <= March 31, 2023 → Result: "CONSIDERED" (equal to passed)
            - If date > March 31, 2023 → Result: "FAILED"
            - Consideration note: "Approval until March 31, 2023"

Processing Results:
- Question: "Met all the minimum requirements on approval of the Barangay Budget
   on the Specified Timeframe?"
- Answers: YES / NO
- Logic: Checkbox must be checked AND date validation must pass/consider
```

**Key Learnings**:
- MOV checklists can have **mixed types** (checkbox + date input in same indicator)
- Date inputs can have **deadline validation** with multiple thresholds
- New status type: **"Considered"** - equal value to "Passed" but indicates grace period
- **Grace period logic**: Dates can have both ideal deadline and consideration deadline
- **Consideration notes**: Explain why result is "considered" vs "passed"
- Validation status now has **3 states**: `passed`, `considered`, `failed`

#### ✅ Example 4: Indicator 1.6 - SK Fund Release (Mutually Exclusive + Conditional Logic)
```
1.6 Presence of Approved Annual Barangay Youth Investment Program (ABYIP) for 2023

└── 1.6.1 Compliance with Section 20 of SK Reform Act
    ├── MUTUALLY EXCLUSIVE: Only ONE of the following scenarios applies
    │
    ├── 1.6.1.1: Barangay HAS SK Agreement (2 checkboxes)
    │   ├── a) Copy of written agreement
    │   └── b) Proof of deposit (Account No, SK name, allocated amount)
    │       └── Consideration: "In absence of deposit slips, bank statements
    │           will be considered, provided transaction date shows total 10%
    │           of SK Fund has been transferred"
    │
    ├── 1.6.1.2: NO SK Agreement BUT has current account (1 checkbox)
    │   └── Deposit slips (Account No, SK name, allocated amount)
    │       └── Consideration: Same alternative evidence as 1.6.1.1
    │
    └── 1.6.1.3: NO SK Officials OR no quorum/bank account (2 checkboxes)
        ├── (a) Proof of transfer to trust fund OR Deposit Receipt
        └── (b) Legal forms/documents from city/municipal treasurer
        └── Exclusion: "SK Resolution authorizing use of SK Funds shall
            NOT be considered as MOV under this indicator"

└── 1.6.2 Presence of Approved ABYIP
    ├── CONDITIONAL: If barangay has ≥5 SK Officials
    │   ├── Approved Resolution approving 2023 SK Annual/Supplemental Budget
    │   └── Approved 2023 ABYIP signed by SK Chairperson and members
    │
    └── CONDITIONAL: If barangay has ≤4 SK Officials
        └── Certification from C/MLGOO on number of SK officials

Validation Logic:
- Validator selects which 1.6.1.x scenario applies to barangay
- System shows only relevant checklist items for selected scenario
- For 1.6.2, system queries barangay profile for SK Official count
- Alternative evidence is acceptable (bank statements instead of deposit slips)
- Excluded evidence (SK Resolution) triggers warning
```

**Key Learnings**:
- **Mutually exclusive sub-indicators**: Only ONE scenario applies per barangay
- **Validator scenario selection**: Must choose which path (1.6.1.1, 1.6.1.2, or 1.6.1.3)
- **Conditional checklist items**: Show/hide based on external data (SK Official count)
- **Alternative evidence**: "Consideration" notes describe substitute acceptable documents
- **Exclusion rules**: Explicitly mark certain evidence as NOT acceptable
- **Alternative evidence ≠ Grace period**: Both are "consideration" but different concepts:
  - Date grace period: Time-based extension
  - Alternative evidence: Different acceptable document types

#### ✅ Example 5: Indicator 2.1.4 - BDRRMC Accomplishment (OR Evidence Paths + Assessment)
```
2.1.4 Accomplishment Report

└── OR Logic: Path A OR Path B satisfies the requirement
    │
    ├── PATH A: Physical Accomplishment (≥50% threshold)
    │   ├── Assessment Question: "At least 50% accomplishment of physical targets?"
    │   │   └── YES/NO radio buttons (validator judgment)
    │   │
    │   └── If YES selected → Show:
    │       ├── Checkbox: Accomplishment Report
    │       ├── Checkbox: Certification on submission and correctness signed by C/MDRRMO
    │       └── Number Input: "% of programs, project, and activities are completed"
    │           └── Validation: Must be ≥ 50%
    │
    └── PATH B: Fund Utilization (≥50% threshold)
        ├── Assessment Question: "At least 50% fund utilization of 70% component?"
        │   └── YES/NO radio buttons (validator judgment)
        │
        └── If YES selected → Show:
            ├── Checkbox: Annual BDRRM Utilization Report
            ├── Checkbox: Certification on submission and correctness signed by C/MDRRMO
            ├── Currency Input: "Amount utilized (as of Dec 31, 2023)"
            └── Currency Input: "Amount allocated for PAPs in BDRRM Plan for CY 2023"
                └── Auto-calculation: (Amount utilized / Amount allocated) × 100
                └── Validation: Must be ≥ 50%

Validation Logic:
- Validator selects YES on either Path A OR Path B (or both)
- If Path A YES: Check percentage input ≥ 50% AND checkboxes verified
- If Path B YES: Calculate utilization rate ≥ 50% AND checkboxes verified
- If EITHER path passes → Indicator PASSES
- If BOTH paths selected and both pass → Indicator PASSES
- If NO path selected or ALL selected paths fail → Indicator FAILS
```

**Key Learnings**:
- **OR evidence paths**: Multiple ways to satisfy requirement within SAME indicator
- **Assessment fields**: YES/NO radio buttons for validator judgments (not checkboxes)
- **Intra-checklist conditions**: Items show/hide based on other items in SAME checklist
- **Calculation validation**: Auto-calculate formulas and validate thresholds
- **Threshold validation**: Numeric/percentage inputs with minimum requirements
- **OR vs one_of**:
  - `one_of` (v1.3): Only ONE sub-indicator applies (mutually exclusive children)
  - OR groups (v1.4): Multiple paths can ALL be attempted, ANY passing path satisfies requirement

---

## System Architecture

### 1. Hierarchical Indicator Structure

#### Supported Depths
- **Level 0**: Governance Area (e.g., "Financial Administration")
- **Level 1**: Core Indicator (e.g., "1.1 BFDP Compliance")
- **Level 2**: Sub-indicator (e.g., "1.1.1 Posted documents")
- **Level 3**: Detailed indicator (e.g., "1.1.1.1 Specific requirement") - if needed
- **Maximum Depth**: 4 levels (1.2.3.4)

#### Code Generation
- Automatic hierarchical code generation using DFS traversal
- Codes: "1", "1.1", "1.1.1", "1.1.1.1"
- Persisted in database for sorting/filtering
- Auto-renumbering when indicators are reordered

#### Selection Mode (for Parent Indicators)
- **`all`** (default): All child indicators must be validated
- **`one_of`**: Only ONE child indicator applies (mutually exclusive)
  - Example: Indicator 1.6.1 has three scenarios (1.6.1.1, 1.6.1.2, 1.6.1.3)
  - Validator selects which scenario applies to the barangay
  - System validates only the selected child indicator
  - Other child indicators are marked as "not_applicable"

---

### 2. MOV Checklist System

#### Structure (JSONB in database)

```typescript
interface MOVChecklistItem {
  id: string;                    // Unique ID (e.g., "mov_1_a", "input_cy2022")
  type: 'checkbox' | 'group' | 'currency_input' | 'number_input' | 'text_input' | 'date_input' | 'assessment';
  label: string;                 // Display text
  required: boolean;             // Is this required for PASS?
  display_order: number;         // Display order

  // OR group membership (NEW in v1.4)
  or_group?: string;             // ID of OR group this item belongs to
  or_group_operator?: 'ANY' | 'ALL'; // ANY (default): Any path passes = indicator passes
                                     // ALL: All attempted paths must pass

  // Document counting (for type='checkbox')
  requires_count?: boolean;      // Does this item require count input?
  min_count?: number;            // Minimum document count
  max_count?: number;            // Maximum document count (optional)
  count_label?: string;          // Label for count input

  // Grouping (for type='group')
  children?: MOVChecklistItem[]; // Nested items under group

  // Conditional display (NEW in v1.3, enhanced in v1.4)
  condition?: {
    type: 'external_data' | 'user_selection' | 'checklist_item';

    // For external_data type (e.g., "number of SK Officials")
    source?: string;             // Data source (e.g., "barangay.sk_official_count")
    operator?: '>' | '<' | '>=' | '<=' | '==' | '!=';
    value?: any;                 // Comparison value

    // For user_selection type (e.g., "Does barangay have SK Agreement?")
    question?: string;           // Question to ask validator
    answer?: string;             // Expected answer to show this item

    // For checklist_item type (NEW in v1.4) - Intra-checklist conditions
    depends_on_item?: string;    // ID of item in SAME checklist
    expected_value?: any;        // Expected value (e.g., "yes" for assessment, true for checkbox)
  };

  // Alternative evidence (NEW in v1.3)
  alternative_items?: string[];  // IDs of items where ANY can satisfy requirement
  consideration_note?: string;   // Note explaining alternative evidence

  // Exclusion rules (NEW in v1.3)
  excluded_evidence?: string[];  // List of evidence types NOT acceptable
  exclusion_warning?: string;    // Warning if excluded evidence detected

  // Input field configuration (for input types)
  input_config?: {
    data_type: 'string' | 'number' | 'currency' | 'date';
    placeholder?: string;        // Placeholder text (e.g., "₱0.00", "YYYY-MM-DD")
    unit?: string;               // Unit label (e.g., "PHP", "kg", "%")

    // Calculation formula (NEW in v1.4)
    calculation?: {
      formula: string;           // Formula expression (e.g., "(field_a / field_b) * 100")
      operands: string[];        // IDs of fields used in calculation
      auto_calculate?: boolean;  // Auto-calculate on change (default: true)
      display_result?: boolean;  // Display calculated result (default: false)
    };

    // Validation rules
    validation_rules?: {
      min_value?: number;        // Minimum value (for number/currency)
      max_value?: number;        // Maximum value (for number/currency)
      pattern?: string;          // Regex pattern (for text)

      // Threshold validation (NEW in v1.4)
      threshold?: number;        // Threshold value (e.g., 50 for 50%)
      threshold_operator?: '>=' | '>' | '<=' | '<'; // Comparison operator

      // Comparison validation (e.g., "CY 2023 > CY 2022")
      compare_to?: string;       // ID of field to compare against
      compare_operator?: '>' | '<' | '>=' | '<=' | '==' | '!=';
      compare_warning?: string;  // Warning message if comparison fails

      // Date deadline validation (for date inputs)
      deadline?: string;         // Ideal deadline (YYYY-MM-DD) → Result: "passed"
      grace_deadline?: string;   // Grace period deadline (YYYY-MM-DD) → Result: "considered"
      consideration_note?: string; // Note explaining consideration period
    };
  };

  // Assessment field configuration (NEW in v1.4, for type='assessment')
  assessment_config?: {
    question: string;            // Question text for validator
    options: Array<{
      value: string;             // Option value (e.g., "yes", "no")
      label: string;             // Display label (e.g., "YES", "NO")
    }>;
    default_value?: string;      // Default selection
  };

  // Help text
  help_text?: string;            // Additional guidance for validators
}
```

**Type Descriptions**:
- **`checkbox`**: Standard checklist item (was previously `item`)
- **`group`**: Group header with nested children
- **`currency_input`**: Currency input field (e.g., PHP amounts)
- **`number_input`**: Numeric input field (e.g., counts, percentages)
- **`text_input`**: Text input field (e.g., names, descriptions)
- **`date_input`**: Date picker field (e.g., implementation dates)
- **`assessment`**: YES/NO radio buttons for validator judgment (NEW in v1.4)

#### Example 1: Indicator 1.1.1 MOV Checklist (Checkbox-based)

```json
{
  "mov_checklist_items": [
    {
      "id": "mov_1_1",
      "type": "checkbox",
      "label": "BFDP Monitoring Form A of the DILG Advisory",
      "required": true,
      "display_order": 1
    },
    {
      "id": "mov_1_2",
      "type": "checkbox",
      "label": "Two (2) Photo Documentation of the BFDP board",
      "required": true,
      "requires_count": true,
      "min_count": 2,
      "count_label": "Number of photos submitted",
      "display_order": 2
    },
    {
      "id": "group_annual",
      "type": "group",
      "label": "ANNUAL REPORT",
      "required": true,
      "display_order": 3,
      "children": [
        {
          "id": "mov_annual_a",
          "type": "checkbox",
          "label": "a. Barangay Financial Report",
          "required": true,
          "display_order": 1
        },
        {
          "id": "mov_annual_b",
          "type": "checkbox",
          "label": "b. Barangay Budget",
          "required": true,
          "display_order": 2
        },
        {
          "id": "mov_annual_c",
          "type": "checkbox",
          "label": "c. Summary of Income and Expenditures",
          "required": true,
          "display_order": 3
        },
        {
          "id": "mov_annual_d",
          "type": "checkbox",
          "label": "d. 20% Component of the NTA Utilization",
          "required": true,
          "display_order": 4
        },
        {
          "id": "mov_annual_e",
          "type": "checkbox",
          "label": "e. Annual Procurement Plan or Procurement List",
          "required": true,
          "display_order": 5
        }
      ]
    },
    {
      "id": "group_quarterly",
      "type": "group",
      "label": "QUARTERLY REPORT",
      "required": true,
      "display_order": 4,
      "children": [
        {
          "id": "mov_quarterly_f",
          "type": "checkbox",
          "label": "f. List of Notices of Award (1st-3rd Quarter of CY 2023)",
          "required": true,
          "display_order": 1
        }
      ]
    },
    {
      "id": "group_monthly",
      "type": "group",
      "label": "MONTHLY REPORT",
      "required": true,
      "display_order": 5,
      "children": [
        {
          "id": "mov_monthly_g",
          "type": "checkbox",
          "label": "g. Itemized Monthly Collections and Disbursements",
          "required": true,
          "display_order": 1
        }
      ]
    }
  ]
}
```

#### Example 2: Indicator 1.2 MOV Checklist (Input-based with Validation)

```json
{
  "mov_checklist_items": [
    {
      "id": "input_cy2022",
      "type": "currency_input",
      "label": "CY 2022 Average Monthly Revenue",
      "required": true,
      "display_order": 1,
      "input_config": {
        "data_type": "currency",
        "placeholder": "₱0.00",
        "unit": "PHP",
        "validation_rules": {
          "min_value": 0
        }
      },
      "help_text": "Enter the average monthly revenue for Calendar Year 2022"
    },
    {
      "id": "input_cy2023",
      "type": "currency_input",
      "label": "CY 2023 Average Monthly Revenue",
      "required": true,
      "display_order": 2,
      "input_config": {
        "data_type": "currency",
        "placeholder": "₱0.00",
        "unit": "PHP",
        "validation_rules": {
          "min_value": 0,
          "compare_to": "input_cy2022",
          "compare_operator": ">",
          "compare_warning": "CY 2023 revenue should be greater than CY 2022 to demonstrate innovation. You may proceed with manual override if justified."
        }
      },
      "help_text": "Enter the average monthly revenue for Calendar Year 2023"
    }
  ]
}
```

#### Example 3: Indicator 1.3.1 MOV Checklist (Mixed Types: Checkbox + Date Input)

```json
{
  "mov_checklist_items": [
    {
      "id": "checkbox_ordinance",
      "type": "checkbox",
      "label": "Approved Barangay Appropriation Ordinance signed by the Sangguniang Barangay Members (SBMs), SK Chairperson, Barangay Secretary, and Punong Barangay",
      "required": true,
      "display_order": 1,
      "help_text": "Verify all required signatures are present on the ordinance"
    },
    {
      "id": "input_approval_date",
      "type": "date_input",
      "label": "Date of Approval",
      "required": true,
      "display_order": 2,
      "input_config": {
        "data_type": "date",
        "placeholder": "YYYY-MM-DD",
        "validation_rules": {
          "deadline": "2022-12-31",
          "grace_deadline": "2023-03-31",
          "consideration_note": "Approval until March 31, 2023"
        }
      },
      "help_text": "Enter the date when the ordinance was approved. Ideal deadline: December 31, 2022. Grace period until: March 31, 2023."
    }
  ]
}
```

#### Example 4: Indicator 1.6.1.1 MOV Checklist (Alternative Evidence)

```json
{
  "mov_checklist_items": [
    {
      "id": "checkbox_agreement",
      "type": "checkbox",
      "label": "Copy of the written agreement",
      "required": true,
      "display_order": 1
    },
    {
      "id": "checkbox_deposit_slip",
      "type": "checkbox",
      "label": "Proof of deposit reflecting the Account No./Name of Barangay SK and the total allocated amount for the 2023 SK funds",
      "required": true,
      "display_order": 2,
      "alternative_items": ["checkbox_bank_statement"],
      "consideration_note": "In the absence of deposit slips, bank statements will be considered, provided that it shows the transaction date, and that the total 10% of the SK Fund has been transferred."
    },
    {
      "id": "checkbox_bank_statement",
      "type": "checkbox",
      "label": "Bank statement (Alternative to deposit slip)",
      "required": false,
      "display_order": 3,
      "help_text": "Only if deposit slip is unavailable. Must show transaction date and 10% SK Fund transfer."
    }
  ]
}
```

#### Example 5: Indicator 1.6.2 MOV Checklist (Conditional Items)

```json
{
  "mov_checklist_items": [
    {
      "id": "checkbox_resolution",
      "type": "checkbox",
      "label": "Approved Resolution approving the 2023 SK Annual/Supplemental Budget",
      "required": true,
      "display_order": 1,
      "condition": {
        "type": "external_data",
        "source": "barangay.sk_official_count",
        "operator": ">=",
        "value": 5
      }
    },
    {
      "id": "checkbox_abyip",
      "type": "checkbox",
      "label": "An Approved 2023 ABYIP signed by the SK Chairperson and its members",
      "required": true,
      "display_order": 2,
      "condition": {
        "type": "external_data",
        "source": "barangay.sk_official_count",
        "operator": ">=",
        "value": 5
      }
    },
    {
      "id": "checkbox_certification",
      "type": "checkbox",
      "label": "Certification from the C/MLGOO on number of SK officials",
      "required": true,
      "display_order": 3,
      "condition": {
        "type": "external_data",
        "source": "barangay.sk_official_count",
        "operator": "<=",
        "value": 4
      }
    }
  ]
}
```

#### Example 6: Indicator 1.6.1.3 MOV Checklist (Exclusion Rules)

```json
{
  "mov_checklist_items": [
    {
      "id": "checkbox_proof_transfer",
      "type": "checkbox",
      "label": "Proof of transfer of the 10% 2023 SK funds to the trust fund at the Barangay OR Deposit Receipt",
      "required": true,
      "display_order": 1
    },
    {
      "id": "checkbox_legal_forms",
      "type": "checkbox",
      "label": "Proof of transfer or corresponding legal forms/documents issued by the city/municipal treasurer if the barangay opted that the corresponding SK fund be kept as trust fund in the custody of the C/M treasurer",
      "required": true,
      "display_order": 2,
      "excluded_evidence": ["SK Resolution authorizing use of SK Funds"],
      "exclusion_warning": "Note: SK Resolution authorizing the barangay to utilize the SK Funds if the SK has no bank account shall not be considered as MOV under this indicator."
    }
  ]
}
```

#### Example 7: Indicator 2.1.4 MOV Checklist (OR Groups + Assessment + Calculations)

```json
{
  "mov_checklist_items": [
    {
      "id": "assessment_path_a",
      "type": "assessment",
      "label": "Instruction: Put a check ✓ on the box that corresponds to your assessment",
      "required": false,
      "display_order": 1,
      "or_group": "accomplishment_paths",
      "or_group_operator": "ANY",
      "assessment_config": {
        "question": "a. At least 50% accomplishment of the physical targets in the BDRRM Plan",
        "options": [
          { "value": "yes", "label": "YES" },
          { "value": "no", "label": "NO" }
        ]
      }
    },
    {
      "id": "checkbox_accomplishment_report",
      "type": "checkbox",
      "label": "Accomplishment Report; and",
      "required": true,
      "display_order": 2,
      "or_group": "accomplishment_paths",
      "condition": {
        "type": "checklist_item",
        "depends_on_item": "assessment_path_a",
        "expected_value": "yes"
      }
    },
    {
      "id": "checkbox_accomplishment_cert",
      "type": "checkbox",
      "label": "Certification on the submission and correctness of Accomplishment Report signed by the C/MDRRMO",
      "required": true,
      "display_order": 3,
      "or_group": "accomplishment_paths",
      "condition": {
        "type": "checklist_item",
        "depends_on_item": "assessment_path_a",
        "expected_value": "yes"
      }
    },
    {
      "id": "input_completion_percentage",
      "type": "number_input",
      "label": "% of programs, project, and activities are completed",
      "required": true,
      "display_order": 4,
      "or_group": "accomplishment_paths",
      "condition": {
        "type": "checklist_item",
        "depends_on_item": "assessment_path_a",
        "expected_value": "yes"
      },
      "input_config": {
        "data_type": "number",
        "placeholder": "0",
        "unit": "%",
        "validation_rules": {
          "min_value": 0,
          "max_value": 100,
          "threshold": 50,
          "threshold_operator": ">="
        }
      },
      "help_text": "Enter the percentage of completion (must be at least 50%)"
    },
    {
      "id": "assessment_path_b",
      "type": "assessment",
      "label": "Instruction: Put a check ✓ on the box that corresponds to your assessment",
      "required": false,
      "display_order": 5,
      "or_group": "accomplishment_paths",
      "assessment_config": {
        "question": "b. At least 50% fund utilization of the 70% component of CY 2023 BDRRM Preparedness component as of December 31, 2023",
        "options": [
          { "value": "yes", "label": "YES" },
          { "value": "no", "label": "NO" }
        ]
      }
    },
    {
      "id": "checkbox_utilization_report",
      "type": "checkbox",
      "label": "Annual BDRRM Utilization Report; and",
      "required": true,
      "display_order": 6,
      "or_group": "accomplishment_paths",
      "condition": {
        "type": "checklist_item",
        "depends_on_item": "assessment_path_b",
        "expected_value": "yes"
      }
    },
    {
      "id": "checkbox_utilization_cert",
      "type": "checkbox",
      "label": "Certification on the submission and correctness of fund utilization report signed by the C/MDRRMO",
      "required": true,
      "display_order": 7,
      "or_group": "accomplishment_paths",
      "condition": {
        "type": "checklist_item",
        "depends_on_item": "assessment_path_b",
        "expected_value": "yes"
      }
    },
    {
      "id": "input_amount_utilized",
      "type": "currency_input",
      "label": "Amount utilized (as of Dec 31, 2023)",
      "required": true,
      "display_order": 8,
      "or_group": "accomplishment_paths",
      "condition": {
        "type": "checklist_item",
        "depends_on_item": "assessment_path_b",
        "expected_value": "yes"
      },
      "input_config": {
        "data_type": "currency",
        "placeholder": "₱0.00",
        "unit": "PHP"
      }
    },
    {
      "id": "input_amount_allocated",
      "type": "currency_input",
      "label": "Amount allocated for PAPs in the BDRRM Plan for CY 2023",
      "required": true,
      "display_order": 9,
      "or_group": "accomplishment_paths",
      "condition": {
        "type": "checklist_item",
        "depends_on_item": "assessment_path_b",
        "expected_value": "yes"
      },
      "input_config": {
        "data_type": "currency",
        "placeholder": "₱0.00",
        "unit": "PHP",
        "calculation": {
          "formula": "(input_amount_utilized / input_amount_allocated) * 100",
          "operands": ["input_amount_utilized", "input_amount_allocated"],
          "auto_calculate": true,
          "display_result": true
        },
        "validation_rules": {
          "threshold": 50,
          "threshold_operator": ">="
        }
      },
      "help_text": "System will calculate utilization rate: (Amount utilized / Amount allocated) × 100. Must be at least 50%."
    }
  ]
}
```

---

### 3. BBI Functionality Tracking System

#### Overview
- **BBI** = Barangay-Based Institutions (9 mandatory institutions)
- **Functionality Assessment**: Each BBI has ONE dedicated functionality indicator
- **Relationship Direction**: Indicator result → determines BBI functionality status
- **Example**: Indicator 2.1 passes → BDRRMC marked as "Functional" for that barangay
- **No Cross-References**: BBIs are standalone - no indicators check other BBI statuses

#### Database Schema

**BBIs Table**:
```sql
CREATE TABLE bbis (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,  -- e.g., 'BDRRMC', 'BADAC', 'BPOC'
    description TEXT,
    functionality_indicator_id INTEGER NOT NULL,  -- Points to the indicator that assesses this BBI
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (functionality_indicator_id) REFERENCES indicators(id)
);

-- Example data:
-- INSERT INTO bbis (name, code, functionality_indicator_id) VALUES
-- ('Barangay Disaster Risk Reduction and Management Committee', 'BDRRMC', <indicator_2.1_id>);
-- ('Barangay Anti-Drug Abuse Council', 'BADAC', <indicator_3.1_id>);
```

**BBI Functionality Status per Barangay**:
```sql
-- Tracks whether each BBI is functional for each barangay
-- Status is DETERMINED BY the BBI's functionality indicator result
CREATE TABLE bbi_barangay_status (
    id SERIAL PRIMARY KEY,
    bbi_id INTEGER NOT NULL REFERENCES bbis(id),
    barangay_id INTEGER NOT NULL REFERENCES barangays(id),
    is_functional BOOLEAN NOT NULL,  -- Set when functionality indicator passes/fails
    assessment_date DATE,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(bbi_id, barangay_id)
);
```

#### BBI Status Update Logic

When a BBI functionality indicator is validated, the system updates the BBI status:

```python
def update_bbi_status_after_validation(
    indicator: Indicator,
    barangay_id: int,
    validation_result: str  # 'passed', 'considered', 'failed'
) -> None:
    """
    After validating a BBI functionality indicator, update the BBI status.

    Args:
        indicator: The BBI functionality indicator (e.g., 2.1 for BDRRMC)
        barangay_id: The barangay being assessed
        validation_result: The indicator's validation result
    """
    # Check if this indicator assesses a BBI
    bbi = db.query(BBI).filter(BBI.functionality_indicator_id == indicator.id).first()

    if not bbi:
        # This indicator doesn't assess a BBI, nothing to update
        return

    # Determine if BBI is functional based on indicator result
    # 'passed' and 'considered' both count as functional
    is_functional = validation_result in ['passed', 'considered']

    # Update or create BBI status for this barangay
    bbi_status = db.query(BBIBarangayStatus).filter(
        BBIBarangayStatus.bbi_id == bbi.id,
        BBIBarangayStatus.barangay_id == barangay_id
    ).first()

    if bbi_status:
        bbi_status.is_functional = is_functional
        bbi_status.assessment_date = date.today()
        bbi_status.updated_at = datetime.now()
    else:
        bbi_status = BBIBarangayStatus(
            bbi_id=bbi.id,
            barangay_id=barangay_id,
            is_functional=is_functional,
            assessment_date=date.today()
        )
        db.add(bbi_status)

    db.commit()

    logger.info(f"Updated BBI status: {bbi.code} for barangay {barangay_id} = {'Functional' if is_functional else 'Non-Functional'}")
```

#### Admin UI: BBI Management

In the BBI management admin interface, link BBIs to their functionality indicators:

```typescript
// BBI Management Form (separate admin interface for managing BBIs)
<FormField
  control={form.control}
  name="functionality_indicator_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Functionality Indicator *</FormLabel>
      <Select
        value={field.value?.toString() || ''}
        onValueChange={(value) => field.onChange(parseInt(value))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select the indicator that assesses this BBI" />
        </SelectTrigger>
        <SelectContent>
          {indicators.map((indicator) => (
            <SelectItem key={indicator.id} value={indicator.id.toString()}>
              {indicator.code} - {indicator.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormDescription>
        Select the indicator that evaluates whether this BBI is functional.
        Example: Indicator 2.1 assesses BDRRMC functionality.
      </FormDescription>
    </FormItem>
  )}
/>

<FormField
  control={form.control}
  name="code"
  render={({ field }) => (
    <FormItem>
      <FormLabel>BBI Code *</FormLabel>
      <Input {...field} placeholder="e.g., BDRRMC, BADAC, BPOC" />
      <FormDescription>
        Short code for the BBI (e.g., BDRRMC, BADAC, BPOC, LT, VAW, BDC, BCPC, BNC, BESWMC)
      </FormDescription>
    </FormItem>
  )}
/>
```

**Note**: BBIs are configured separately, not assigned to arbitrary indicators. Each BBI points to its dedicated functionality indicator.

---

### 4. Validation Logic

#### MOV Checklist Validation Algorithm (Enhanced v1.3)

```python
from typing import Dict, List, Tuple, Optional

def validate_mov_checklist(
    indicator: Indicator,
    validator_responses: List[Dict],
    conditional_data: Dict = None  # NEW in v1.3: External data for conditions
) -> Tuple[bool, List[str], str]:
    """
    Validate MOV checklist with support for:
    - Checkboxes with document counts
    - Input fields (currency, number, text, date)
    - Comparison validation between fields
    - Date deadline validation with grace periods
    - Conditional item display (NEW in v1.3)
    - Alternative evidence (NEW in v1.3)
    - Exclusion rules (NEW in v1.3)
    - Groups

    Returns:
        (is_valid, warnings, status) tuple
        - is_valid: True if all requirements met
        - warnings: List of warning messages (allows manual override)
        - status: 'passed' | 'considered' | 'failed'
    """
    responses_map = {r['item_id']: r for r in validator_responses}
    warnings = []
    overall_status = 'passed'  # Track overall status (passed, considered, failed)
    conditional_data = conditional_data or {}

    def should_display_item(item: Dict) -> bool:
        """
        Check if item should be displayed based on conditions.

        NEW in v1.3: external_data, user_selection
        NEW in v1.4: checklist_item (intra-checklist conditions)
        """
        if 'condition' not in item:
            return True  # No condition, always display

        condition = item['condition']

        # NEW in v1.4: Intra-checklist conditions
        if condition['type'] == 'checklist_item':
            depends_on_id = condition['depends_on_item']
            expected_value = condition['expected_value']

            # Get the item this depends on
            depends_on_response = responses_map.get(depends_on_id)
            if not depends_on_response:
                return False  # Dependency not answered, hide item

            # Check if dependency has expected value
            actual_value = depends_on_response.get('value') or depends_on_response.get('checked')
            return actual_value == expected_value

        if condition['type'] == 'external_data':
            # Get value from conditional_data (e.g., barangay.sk_official_count)
            source = condition['source']
            actual_value = conditional_data.get(source)

            if actual_value is None:
                return False  # Data not available, hide item

            operator = condition['operator']
            expected_value = condition['value']

            # Evaluate condition
            if operator == '>' and actual_value > expected_value:
                return True
            elif operator == '<' and actual_value < expected_value:
                return True
            elif operator == '>=' and actual_value >= expected_value:
                return True
            elif operator == '<=' and actual_value <= expected_value:
                return True
            elif operator == '==' and actual_value == expected_value:
                return True
            elif operator == '!=' and actual_value != expected_value:
                return True

            return False

        elif condition['type'] == 'user_selection':
            # Check if user answered the question with expected answer
            user_answer = conditional_data.get(f"question_{condition['question']}")
            return user_answer == condition['answer']

        return True

    def check_item(item: Dict) -> bool:
        """Recursively check item or group."""
        # NEW in v1.3: Check if item should be displayed
        if not should_display_item(item):
            return True  # Hidden items don't block PASS

        if item['type'] == 'group':
            # All children in group must pass
            return all(check_item(child) for child in item.get('children', []))

        # Optional items don't block PASS
        if not item.get('required', True):
            return True

        response = responses_map.get(item['id'])

        # NEW in v1.3: Handle alternative evidence
        if 'alternative_items' in item and item['alternative_items']:
            # Check if ANY of the alternatives is satisfied
            alternatives_checked = False
            for alt_id in item['alternative_items']:
                alt_response = responses_map.get(alt_id)
                if alt_response and alt_response.get('checked', False):
                    alternatives_checked = True
                    if 'consideration_note' in item:
                        warnings.append(f"{item['label']}: {item['consideration_note']}")
                    break

            # If alternative is satisfied, primary is not required
            if alternatives_checked:
                return True

        # NEW in v1.3: Check exclusion rules
        if 'excluded_evidence' in item and item['excluded_evidence']:
            # Check if any excluded evidence was submitted
            for excluded in item['excluded_evidence']:
                # This would need to check uploaded file names or types
                # For now, add warning if exclusion rule exists
                if 'exclusion_warning' in item:
                    warnings.append(item['exclusion_warning'])

        # Handle assessment items (NEW in v1.4)
        if item['type'] == 'assessment':
            # Assessment is optional - validator makes judgment
            # No validation needed, just record the answer
            return True

        # Handle checkbox items
        if item['type'] == 'checkbox':
            if not response or not response.get('checked', False):
                return False  # Required item not checked

            # Check document count if required
            if item.get('requires_count', False):
                min_count = item.get('min_count', 1)
                actual_count = response.get('document_count', 0)
                if actual_count < min_count:
                    return False  # Insufficient document count

            return True

        # Handle input fields (currency, number, text, date)
        if item['type'] in ['currency_input', 'number_input', 'text_input', 'date_input']:
            if not response or response.get('value') in [None, '', 0]:
                return False  # Required input not provided

            # Validate input against rules
            input_config = item.get('input_config', {})
            validation_rules = input_config.get('validation_rules', {})
            value = response.get('value')

            # Min/Max validation
            if 'min_value' in validation_rules and value < validation_rules['min_value']:
                return False
            if 'max_value' in validation_rules and value > validation_rules['max_value']:
                return False

            # NEW in v1.4: Threshold validation
            if 'threshold' in validation_rules:
                threshold = validation_rules['threshold']
                threshold_op = validation_rules.get('threshold_operator', '>=')

                # Apply calculation if present
                input_config = item.get('input_config', {})
                if 'calculation' in input_config:
                    calc = input_config['calculation']
                    # Get operand values
                    operand_values = {}
                    for operand_id in calc['operands']:
                        operand_response = responses_map.get(operand_id)
                        if operand_response:
                            operand_values[operand_id] = operand_response.get('value', 0)

                    # Evaluate formula (simple division and multiplication for now)
                    # In production, use a safe expression evaluator
                    if calc['formula']:
                        try:
                            # Replace operand IDs with values
                            formula_str = calc['formula']
                            for operand_id, operand_val in operand_values.items():
                                formula_str = formula_str.replace(operand_id, str(operand_val))

                            # Evaluate (use eval cautiously in production!)
                            calculated_value = eval(formula_str)
                            value = calculated_value  # Use calculated value for threshold check
                        except:
                            pass  # Calculation failed, use input value

                # Check threshold
                threshold_met = False
                if threshold_op == '>=' and value >= threshold:
                    threshold_met = True
                elif threshold_op == '>' and value > threshold:
                    threshold_met = True
                elif threshold_op == '<=' and value <= threshold:
                    threshold_met = True
                elif threshold_op == '<' and value < threshold:
                    threshold_met = True

                if not threshold_met:
                    return False  # Threshold not met

            # Pattern validation (for text inputs)
            if 'pattern' in validation_rules:
                import re
                if not re.match(validation_rules['pattern'], str(value)):
                    return False

            # Date deadline validation (for date inputs)
            if item['type'] == 'date_input' and ('deadline' in validation_rules or 'grace_deadline' in validation_rules):
                nonlocal overall_status
                from datetime import datetime

                date_value = datetime.strptime(value, '%Y-%m-%d').date()

                # Check ideal deadline first
                if 'deadline' in validation_rules:
                    deadline = datetime.strptime(validation_rules['deadline'], '%Y-%m-%d').date()
                    if date_value <= deadline:
                        # Met ideal deadline → status remains 'passed'
                        pass
                    elif 'grace_deadline' in validation_rules:
                        # Check grace period
                        grace_deadline = datetime.strptime(validation_rules['grace_deadline'], '%Y-%m-%d').date()
                        if date_value <= grace_deadline:
                            # Within grace period → status becomes 'considered'
                            overall_status = 'considered'
                            consideration_note = validation_rules.get('consideration_note', 'Within consideration period')
                            warnings.append(f"{item['label']}: {consideration_note}")
                        else:
                            # Missed both deadlines → FAIL
                            return False
                    else:
                        # Missed ideal deadline with no grace period → FAIL
                        return False

            # Comparison validation (generates warnings, not failures)
            if 'compare_to' in validation_rules:
                compare_id = validation_rules['compare_to']
                compare_response = responses_map.get(compare_id)

                if compare_response and compare_response.get('value') is not None:
                    compare_value = compare_response['value']
                    operator = validation_rules.get('compare_operator', '>')

                    comparison_failed = False
                    if operator == '>' and not (value > compare_value):
                        comparison_failed = True
                    elif operator == '<' and not (value < compare_value):
                        comparison_failed = True
                    elif operator == '>=' and not (value >= compare_value):
                        comparison_failed = True
                    elif operator == '<=' and not (value <= compare_value):
                        comparison_failed = True
                    elif operator == '==' and not (value == compare_value):
                        comparison_failed = True
                    elif operator == '!=' and not (value != compare_value):
                        comparison_failed = True

                    if comparison_failed:
                        warning_msg = validation_rules.get('compare_warning',
                            f"Comparison validation failed: {item['label']} should be {operator} {compare_id}")
                        warnings.append(warning_msg)
                        # Note: This generates a warning but doesn't fail validation
                        # Allows manual override with justification

            return True

        # Unknown type - skip validation
        return True

    # NEW in v1.4: Handle OR groups
    def validate_or_groups() -> bool:
        """Validate OR groups - ANY passing path satisfies requirement."""
        or_groups = {}

        # Group items by or_group
        for item in indicator.mov_checklist_items or []:
            if 'or_group' in item and item['or_group']:
                group_id = item['or_group']
                if group_id not in or_groups:
                    or_groups[group_id] = {
                        'operator': item.get('or_group_operator', 'ANY'),
                        'items': []
                    }
                or_groups[group_id]['items'].append(item)

        # Validate each OR group
        for group_id, group_data in or_groups.items():
            operator = group_data['operator']
            items = group_data['items']

            # Check if ANY assessment in this group is YES
            paths_attempted = []
            for item in items:
                if item['type'] == 'assessment':
                    assessment_response = responses_map.get(item['id'])
                    if assessment_response and assessment_response.get('value') == 'yes':
                        paths_attempted.append(item['id'])

            if not paths_attempted:
                # No paths attempted in this OR group
                return False

            # Validate each attempted path
            paths_passed = []
            for assessment_id in paths_attempted:
                # Get all items in this path (items that depend on this assessment)
                path_items = [i for i in items if i.get('condition', {}).get('depends_on_item') == assessment_id]

                # Check if all path items pass
                path_valid = all(check_item(item) for item in path_items)
                if path_valid:
                    paths_passed.append(assessment_id)

            # Apply operator
            if operator == 'ANY':
                # At least one path must pass
                if not paths_passed:
                    return False
            elif operator == 'ALL':
                # All attempted paths must pass
                if len(paths_passed) != len(paths_attempted):
                    return False

        return True

    # Check regular items (no or_group)
    regular_items = [item for item in indicator.mov_checklist_items or [] if 'or_group' not in item or not item['or_group']]
    regular_items_valid = all(check_item(item) for item in regular_items)

    # Check OR groups
    or_groups_valid = validate_or_groups()

    # Overall validation
    is_valid = regular_items_valid and or_groups_valid

    # If validation failed, status is 'failed'
    if not is_valid:
        overall_status = 'failed'

    return (is_valid, warnings, overall_status)
```

#### Parent-Child Aggregation

```python
def aggregate_parent_status(
    parent_indicator: Indicator,
    child_responses: List[AssessmentResponse],
    barangay_id: int
) -> str:
    """
    Aggregate child indicator statuses to determine parent status.

    Supports AND/OR logical operators.
    """
    if not child_responses:
        return 'pending'

    child_statuses = [r.indicator_validation_status for r in child_responses]

    # If any child is PENDING, parent is PENDING
    if 'pending' in child_statuses:
        return 'pending'

    # Apply logical operator
    if parent_indicator.logical_operator == 'AND':
        # All children must PASS
        return 'pass' if all(s == 'pass' for s in child_statuses) else 'fail'

    elif parent_indicator.logical_operator == 'OR':
        # At least one child must PASS
        return 'pass' if any(s == 'pass' for s in child_statuses) else 'fail'

    return 'pending'
```

#### Mutually Exclusive Scenario Selection (NEW in v1.3)

```python
def aggregate_one_of_parent_status(
    parent_indicator: Indicator,
    child_indicators: List[Indicator],
    selected_child_id: int,
    assessment_responses: List[AssessmentResponse]
) -> str:
    """
    Handle 'one_of' selection mode where only ONE child indicator applies.

    Args:
        parent_indicator: The parent with selection_mode='one_of'
        child_indicators: All child indicators
        selected_child_id: ID of the child indicator selected by validator
        assessment_responses: All responses for this assessment

    Returns:
        Aggregated status: 'passed', 'considered', 'failed', 'pending'
    """
    # Find the selected child's response
    selected_response = next(
        (r for r in assessment_responses if r.indicator_id == selected_child_id),
        None
    )

    if not selected_response:
        return 'pending'

    # Parent status = selected child's status
    parent_status = selected_response.indicator_validation_status

    # Mark all non-selected children as 'not_applicable'
    for child in child_indicators:
        if child.id != selected_child_id:
            child_response = next(
                (r for r in assessment_responses if r.indicator_id == child.id),
                None
            )
            if child_response:
                child_response.indicator_validation_status = 'not_applicable'

    return parent_status
```

---

### 5. User Workflows

#### BLGU Workflow (Assessment Submission)

1. **Load Assessment Form**
   - Display hierarchical indicator tree
   - Show only leaf indicators as interactive (1.1.1, 1.1.2)
   - Parent indicators show aggregated completion

2. **Answer Leaf Indicators**
   - Toggle Yes/No/N/A
   - If Yes: Upload required documents
   - Add optional notes
   - **Important**: BLGU users do NOT enter data in input fields (currency, number, text, date)

3. **Document Upload**
   - Drag-and-drop file upload
   - File validation (type, size)
   - Display uploaded files with preview
   - BLGU's only responsibility is uploading supporting documents

4. **Submit Assessment**
   - Validate all required indicators completed
   - Submit for assessor/validator review

#### Validator Workflow (Assessment Review)

1. **Load Submission**
   - Split-view: 25% indicator tree + 75% workspace
   - Select indicator to review

2. **Review Indicator (4-Section Card)**

   **Section 1: Minimum Requirement**
   - Display rich text requirement statement
   - Show BLGU's Yes/No answer
   - Show BLGU's notes
   - **NEW in v1.3**: If indicator has mutually exclusive children (selection_mode='one_of'), show scenario selector

   **Section 2: MOV Checklist**
   - Display checklist items (with groups if applicable)
   - **For checkboxes**: Check off items as verified, enter document counts where required
   - **For input fields**: Enter data values (currency amounts, numbers, text, dates)
   - **NEW in v1.3 - Conditional Items**: Only show items that match conditions (e.g., ≥5 SK Officials)
   - **NEW in v1.3 - Alternative Evidence**: Show consideration notes when alternative evidence used
   - **NEW in v1.3 - Exclusion Rules**: Display warnings for excluded evidence types
   - **Validation feedback**: Show warnings for failed comparison validations (allows override)
   - **Visual feedback**: Group progress bars (e.g., "ANNUAL REPORT: 3/5 checked")

   **Section 3: Document Verification**
   - List of BLGU-uploaded files
   - Preview documents in modal
   - Mark documents as verified

   **Section 4: Processing Result**
   - Auto-calculated status based on MOV checklist
   - If BBI associated: Display BBI functionality status
   - Option to manually override with justification
   - Enter validator comments

3. **Complete Validation**
   - Status propagates to parent indicators
   - Real-time aggregation display

#### Admin Workflow (Indicator Builder)

1. **Create/Edit Indicator**
   - Split-pane: 30% tree navigator + 70% schema editor

2. **Basic Info Tab**
   - Code (auto-generated or manual)
   - Name, description
   - Parent selection
   - Display order

3. **Calculation Tab**
   - Auto-calc method: AUTO / MANUAL / NONE
   - Logical operator: AND / OR (for parent indicators)
   - **BBI Association**: Dropdown to select BBI (optional)

4. **MOV Checklist Tab**
   - Add/remove checklist items
   - Create groups with nested items
   - Set document count requirements
   - Drag-drop reorder

5. **Preview Tab**
   - Live preview of BLGU view
   - Live preview of Validator view

---

## Database Schema

### Indicators Table (Modified)

```sql
ALTER TABLE indicators ADD COLUMN code VARCHAR(50) NULL;
ALTER TABLE indicators ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE indicators ADD COLUMN logical_operator VARCHAR(10) NULL; -- 'AND' or 'OR'
ALTER TABLE indicators ADD COLUMN selection_mode VARCHAR(10) NOT NULL DEFAULT 'all'; -- 'all' or 'one_of' (NEW in v1.3)
ALTER TABLE indicators ADD COLUMN auto_calc_method VARCHAR(20) NOT NULL DEFAULT 'NONE'; -- 'AUTO', 'MANUAL', 'NONE'
ALTER TABLE indicators ADD COLUMN minimum_requirement_html TEXT NULL;
ALTER TABLE indicators ADD COLUMN mov_checklist_items JSONB NULL;
ALTER TABLE indicators ADD COLUMN associated_bbi_id INTEGER NULL;

-- Indexes
CREATE INDEX idx_indicators_code ON indicators(code);
CREATE INDEX idx_indicators_display_order ON indicators(display_order);
CREATE INDEX idx_indicators_area_parent ON indicators(governance_area_id, parent_id);

-- Foreign Key
ALTER TABLE indicators ADD FOREIGN KEY (associated_bbi_id) REFERENCES bbis(id) ON DELETE SET NULL;
```

### Assessment Responses Table (Modified)

```sql
ALTER TABLE assessment_responses ADD COLUMN mov_checklist_responses JSONB NULL;
-- Structure for checkboxes: [{"item_id": "mov_1", "checked": true, "document_count": 2}, ...]
-- Structure for input fields: [{"item_id": "input_cy2022", "value": 50000.00}, ...]
-- Combined example: [
--   {"item_id": "mov_1", "checked": true},
--   {"item_id": "input_cy2022", "value": 50000.00},
--   {"item_id": "input_cy2023", "value": 55000.00}
-- ]

ALTER TABLE assessment_responses ADD COLUMN document_verifications JSONB NULL;
-- Structure: {"file_123": true, "file_456": false, ...}

ALTER TABLE assessment_responses ADD COLUMN indicator_validation_status VARCHAR(20) NULL; -- 'passed', 'considered', 'failed', 'pending', 'manual_override', 'not_applicable'
ALTER TABLE assessment_responses ADD COLUMN validator_comments TEXT NULL;
ALTER TABLE assessment_responses ADD COLUMN validation_warnings JSONB NULL; -- Array of warning messages from comparison validation
ALTER TABLE assessment_responses ADD COLUMN selected_scenario_id INTEGER NULL; -- For 'one_of' indicators: which child was selected (NEW in v1.3)
ALTER TABLE assessment_responses ADD COLUMN conditional_data JSONB NULL; -- External data used for conditional logic (NEW in v1.3)
ALTER TABLE assessment_responses ADD COLUMN alternative_evidence_used JSONB NULL; -- Track which alternative was used (NEW in v1.3)
ALTER TABLE assessment_responses ADD COLUMN is_auto_calculated BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE assessment_responses ADD COLUMN override_reason TEXT NULL;
ALTER TABLE assessment_responses ADD COLUMN override_by INTEGER NULL;
ALTER TABLE assessment_responses ADD COLUMN override_at TIMESTAMP NULL;

-- Foreign Key
ALTER TABLE assessment_responses ADD FOREIGN KEY (override_by) REFERENCES users(id) ON DELETE SET NULL;

-- Index
CREATE INDEX idx_responses_validation_status ON assessment_responses(indicator_validation_status);
```

---

## API Endpoints

### Indicator Management

```
GET    /api/v1/indicators/tree/{governance_area_id}
       → Returns hierarchical indicator tree

PUT    /api/v1/indicators/reorder
       → Bulk reorder + optional code regeneration

GET    /api/v1/bbis
       → List all BBIs for dropdown selection

PUT    /api/v1/indicators/{id}
       → Update indicator (including associated_bbi_id)
```

### Validation

```
POST   /api/v1/validation/assessments/{id}/indicators/{indicator_id}
       → Submit validator response
       Body: {
         mov_checklist_responses: [
           // Checkbox items
           {item_id: "mov_1", checked: true, document_count: 2},
           // Input fields
           {item_id: "input_cy2022", value: 50000.00},
           {item_id: "input_cy2023", value: 55000.00}
         ],
         document_verifications: {file_123: true},
         validator_comments: "...",
         manual_override: false,
         override_reason: "...", // Required if manual_override is true

         // NEW in v1.3: For mutually exclusive scenarios
         selected_scenario_id: 123, // Child indicator ID selected

         // NEW in v1.3: For conditional items
         conditional_data: {
           "barangay.sk_official_count": 6,
           "question_has_sk_agreement": "yes"
         },

         // NEW in v1.3: Track alternative evidence used
         alternative_evidence_used: {
           "mov_deposit_slip": "mov_bank_statement"
         }
       }

       Response: {
         status: "passed" | "considered" | "failed" | "pending" | "not_applicable",
         warnings: [
           "CY 2023 should be greater than CY 2022...",
           "Date of Approval: Approval until March 31, 2023",
           "Proof of deposit: In the absence of deposit slips, bank statements will be considered..."
         ],
         remarks: "All requirements met" | "Requirements met within consideration period"
       }

GET    /api/v1/barangays/{id}/conditional-data
       → Get barangay data for conditional logic (NEW in v1.3)
       Response: {
         sk_official_count: 6,
         has_sk_agreement: true,
         ...
       }

GET    /api/v1/validation/assessments/{id}/status
       → Get complete validation status tree

GET    /api/v1/bbis/{bbi_id}/status/{barangay_id}
       → Get BBI functionality status for barangay
```

---

## Frontend Components

### Validator MOV Checklist Form (Enhanced)

```typescript
function MOVChecklistForm({ indicator, responses, onResponseChange }) {
  return (
    <div className="space-y-4">
      {indicator.mov_checklist_items.map((item) => {
        if (item.type === 'group') {
          return (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{item.label}</h4>
                {/* Group Progress */}
                <span className="text-sm text-muted-foreground">
                  {getGroupProgress(item, responses)} checked
                </span>
              </div>
              <div className="space-y-2 ml-4">
                {item.children.map((child) => (
                  <ChecklistItemRow
                    key={child.id}
                    item={child}
                    response={responses[child.id]}
                    onResponseChange={onResponseChange}
                  />
                ))}
              </div>
              {/* Group Progress Bar */}
              <ProgressBar
                value={getGroupProgressPercent(item, responses)}
                className="mt-3"
              />
            </div>
          );
        }

        return (
          <ChecklistItemRow
            key={item.id}
            item={item}
            response={responses[item.id]}
            onResponseChange={onResponseChange}
          />
        );
      })}
    </div>
  );
}

function ChecklistItemRow({ item, response, onResponseChange, allResponses, warnings }) {
  // Checkbox item
  if (item.type === 'checkbox') {
    return (
      <div className="flex items-center gap-3 p-2">
        <Checkbox
          checked={response?.checked || false}
          onCheckedChange={(checked) =>
            onResponseChange(item.id, { ...response, checked })
          }
        />
        <label className="flex-1 text-sm">{item.label}</label>

        {/* Document Count Input */}
        {item.requires_count && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={item.min_count || 0}
              max={item.max_count}
              value={response?.document_count || 0}
              onChange={(e) =>
                onResponseChange(item.id, {
                  ...response,
                  document_count: parseInt(e.target.value)
                })
              }
              className="w-20 text-sm"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {item.count_label || 'count'}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Currency input field
  if (item.type === 'currency_input') {
    const hasWarning = warnings.some(w => w.includes(item.label));

    return (
      <div className="space-y-2 p-3 border rounded-md">
        <label className="text-sm font-medium">{item.label}</label>
        {item.help_text && (
          <p className="text-xs text-muted-foreground">{item.help_text}</p>
        )}
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            placeholder={item.input_config?.placeholder}
            value={response?.value || ''}
            onChange={(e) =>
              onResponseChange(item.id, { value: parseFloat(e.target.value) })
            }
            className={cn("flex-1", hasWarning && "border-orange-500")}
          />
          {item.input_config?.unit && (
            <span className="text-sm text-muted-foreground">
              {item.input_config.unit}
            </span>
          )}
        </div>
        {hasWarning && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {warnings.find(w => w.includes(item.label))}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Number input field
  if (item.type === 'number_input') {
    return (
      <div className="space-y-2 p-3 border rounded-md">
        <label className="text-sm font-medium">{item.label}</label>
        {item.help_text && (
          <p className="text-xs text-muted-foreground">{item.help_text}</p>
        )}
        <Input
          type="number"
          placeholder={item.input_config?.placeholder}
          min={item.input_config?.validation_rules?.min_value}
          max={item.input_config?.validation_rules?.max_value}
          value={response?.value || ''}
          onChange={(e) =>
            onResponseChange(item.id, { value: parseInt(e.target.value) })
          }
        />
      </div>
    );
  }

  // Text input field
  if (item.type === 'text_input') {
    return (
      <div className="space-y-2 p-3 border rounded-md">
        <label className="text-sm font-medium">{item.label}</label>
        {item.help_text && (
          <p className="text-xs text-muted-foreground">{item.help_text}</p>
        )}
        <Input
          type="text"
          placeholder={item.input_config?.placeholder}
          value={response?.value || ''}
          onChange={(e) =>
            onResponseChange(item.id, { value: e.target.value })
          }
        />
      </div>
    );
  }

  // Date input field with deadline validation
  if (item.type === 'date_input') {
    const hasDeadline = item.input_config?.validation_rules?.deadline;
    const hasGraceDeadline = item.input_config?.validation_rules?.grace_deadline;
    const hasWarning = warnings.some(w => w.includes(item.label));

    // Calculate status based on entered date
    let dateStatus = null;
    if (response?.value && hasDeadline) {
      const enteredDate = new Date(response.value);
      const deadline = new Date(item.input_config.validation_rules.deadline);
      const graceDeadline = hasGraceDeadline
        ? new Date(item.input_config.validation_rules.grace_deadline)
        : null;

      if (enteredDate <= deadline) {
        dateStatus = 'passed';
      } else if (graceDeadline && enteredDate <= graceDeadline) {
        dateStatus = 'considered';
      } else {
        dateStatus = 'failed';
      }
    }

    return (
      <div className="space-y-2 p-3 border rounded-md">
        <label className="text-sm font-medium">{item.label}</label>
        {item.help_text && (
          <p className="text-xs text-muted-foreground">{item.help_text}</p>
        )}
        <Input
          type="date"
          value={response?.value || ''}
          onChange={(e) =>
            onResponseChange(item.id, { value: e.target.value })
          }
          className={cn(
            dateStatus === 'considered' && "border-blue-500",
            dateStatus === 'failed' && "border-red-500"
          )}
        />

        {/* Display deadline information */}
        {hasDeadline && (
          <div className="text-xs space-y-1">
            <p className="text-muted-foreground">
              Ideal deadline: {item.input_config.validation_rules.deadline}
            </p>
            {hasGraceDeadline && (
              <p className="text-muted-foreground">
                Grace period until: {item.input_config.validation_rules.grace_deadline}
              </p>
            )}
          </div>
        )}

        {/* Display status badge */}
        {dateStatus && (
          <div className="flex items-center gap-2">
            {dateStatus === 'passed' && (
              <Badge variant="success">✓ Passed - Met ideal deadline</Badge>
            )}
            {dateStatus === 'considered' && (
              <Badge variant="default" className="bg-blue-500">
                ⓘ Considered - Within grace period
              </Badge>
            )}
            {dateStatus === 'failed' && (
              <Badge variant="destructive">✗ Failed - Missed deadline</Badge>
            )}
          </div>
        )}

        {/* Display consideration warning */}
        {hasWarning && (
          <Alert variant="info">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {warnings.find(w => w.includes(item.label))}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return null;
}
```

---

## Open Questions & TODOs

### Questions to Answer with More Examples

1. ✅ **BBI Association** - Confirmed: Level 2 indicators can have BBI associations
2. ✅ **Document Counting** - Confirmed: BLGU enters counts, validators verify
3. ✅ **Group Progress** - Confirmed: Show group-level progress feedback
4. ✅ **Input Fields** - Confirmed: Validators enter currency, number, text, date values
5. ✅ **Comparison Validation** - Confirmed: Field comparisons show warnings but allow override
6. ✅ **BLGU Data Entry** - Confirmed: BLGU only uploads files, does NOT enter input field data
7. ✅ **Mixed Checklist Types** - Confirmed: Indicators can have both checkboxes AND input fields (1.3.1)
8. ✅ **Date Deadline Validation** - Confirmed: Date inputs can have ideal deadline and grace period
9. ✅ **Considered Status** - Confirmed: New status type for grace period compliance (equal to passed)
10. ✅ **Mutually Exclusive Sub-indicators** - Confirmed: Only ONE child applies (1.6.1.1, 1.6.1.2, 1.6.1.3)
11. ✅ **Conditional Checklist Items** - Confirmed: Show/hide based on external data or user selection (1.6.2)
12. ✅ **Alternative Evidence** - Confirmed: "Consideration" notes for substitute acceptable documents (1.6.1.1)
13. ✅ **Exclusion Rules** - Confirmed: Explicitly mark certain evidence as NOT acceptable (1.6.1.3)
14. ✅ **OR Evidence Paths** - Confirmed: Multiple ways to satisfy requirement within SAME indicator (2.1.4)
15. ✅ **Assessment Fields** - Confirmed: YES/NO radio buttons for validator judgments (2.1.4)
16. ✅ **Intra-checklist Conditions** - Confirmed: Items depend on other items in SAME checklist (2.1.4)
17. ✅ **Calculation Validation** - Confirmed: Auto-calculate formulas and validate thresholds (2.1.4)
18. ✅ **Threshold Validation** - Confirmed: Numeric/percentage inputs with minimum requirements (≥50%)
19. ⏳ **Nested Groups** - Pending: Can groups be nested further? (Answer with more examples)
20. ⏳ **Optional Groups** - Pending: Can entire groups be optional? (Answer with more examples)
21. ⏳ **Weighted Scoring** - Pending: Do any indicators use weighted scoring instead of Pass/Fail?

### Implementation TODOs

**Database & Backend:**
- [ ] Add `associated_bbi_id` field to indicators table
- [ ] Add `validation_warnings` JSONB column to assessment_responses table
- [ ] Update `indicator_validation_status` to support 'considered' and 'not_applicable' statuses
- [ ] Add `selection_mode` field to indicators table ('all' or 'one_of') - NEW v1.3
- [ ] Add `selected_scenario_id` field to assessment_responses table - NEW v1.3
- [ ] Add `conditional_data` JSONB field to assessment_responses table - NEW v1.3
- [ ] Add `alternative_evidence_used` JSONB field to assessment_responses table - NEW v1.3
- [ ] Update validation logic to support input field types
- [ ] Implement comparison validation with warning generation
- [ ] Implement date deadline validation with grace periods
- [ ] Implement conditional item display logic - NEW v1.3
- [ ] Implement alternative evidence validation logic - NEW v1.3
- [ ] Implement exclusion rule checking - NEW v1.3
- [ ] Implement mutually exclusive scenario selection - NEW v1.3
- [ ] Implement OR group validation logic - NEW v1.4
- [ ] Implement intra-checklist conditional logic - NEW v1.4
- [ ] Implement calculation formulas and evaluation - NEW v1.4
- [ ] Implement threshold validation - NEW v1.4
- [ ] Update validation return signature to include status ('passed', 'considered', 'failed')
- [ ] Create BBI management endpoints
- [ ] Create barangay conditional data endpoint - NEW v1.3

**Frontend - Validator Interface:**
- [ ] Build input field renderers (currency, number, text, date)
- [ ] Build assessment field renderer (YES/NO radio buttons) - NEW v1.4
- [ ] Implement comparison validation UI with warning alerts
- [ ] Implement date deadline validation UI with status badges (passed/considered/failed)
- [ ] Display grace period information for date inputs
- [ ] Add "Considered" status badge styling (blue)
- [ ] Add "Not Applicable" status badge styling (gray) - NEW v1.3
- [ ] Add manual override functionality with justification field
- [ ] Build nested MOV checklist UI with group headers
- [ ] Add document count inputs to validator checklist form
- [ ] Add group-level progress bars in validator UI
- [ ] Display validation warnings prominently
- [ ] Support mixed checklist types (checkboxes + inputs) in single indicator
- [ ] Implement scenario selector for mutually exclusive sub-indicators - NEW v1.3
- [ ] Implement conditional item display (show/hide based on conditions) - NEW v1.3
- [ ] Implement intra-checklist conditional logic (items depend on other items) - NEW v1.4
- [ ] Display alternative evidence consideration notes - NEW v1.3
- [ ] Display exclusion rule warnings - NEW v1.3
- [ ] Fetch and use barangay conditional data (SK Official count, etc.) - NEW v1.3
- [ ] Implement OR group UI (visual grouping of alternative paths) - NEW v1.4
- [ ] Implement auto-calculation for formulas - NEW v1.4
- [ ] Display calculated results inline - NEW v1.4
- [ ] Implement threshold validation feedback - NEW v1.4

**Frontend - Admin Interface:**
- [ ] Update indicator builder to include BBI dropdown
- [ ] Add selection_mode toggle ('all' vs 'one_of') for parent indicators - NEW v1.3
- [ ] Add input field configuration UI (type, placeholder, validation rules)
- [ ] Add assessment field configuration UI (question, options) - NEW v1.4
- [ ] Add comparison validation rule builder
- [ ] Add date deadline configuration UI (deadline, grace_deadline, consideration_note)
- [ ] Add threshold validation rule builder - NEW v1.4
- [ ] Add calculation formula builder - NEW v1.4
- [ ] Add conditional display rule builder (external_data, user_selection, checklist_item) - NEW v1.3/v1.4
- [ ] Add alternative evidence configuration UI (alternative_items, consideration_note) - NEW v1.3
- [ ] Add exclusion rule configuration UI (excluded_evidence, exclusion_warning) - NEW v1.3
- [ ] Add OR group configuration UI (or_group, or_group_operator) - NEW v1.4
- [ ] Add preview for input field types in indicator builder
- [ ] Add preview for assessment fields in indicator builder - NEW v1.4
- [ ] Support mixed checklist type configuration (checkboxes + inputs + assessments)

**Testing:**
- [ ] Test checkbox-based indicators (1.1.1 pattern)
- [ ] Test input-based indicators with comparison validation (1.2 pattern)
- [ ] Test mixed checklist types with date deadline validation (1.3.1 pattern)
- [ ] Test date deadline validation edge cases (on deadline, in grace period, after grace period)
- [ ] Test "considered" status propagation to parent indicators
- [ ] Test comparison validation edge cases
- [ ] Test manual override workflow
- [ ] Test mutually exclusive scenario selection (1.6.1 pattern) - NEW v1.3
- [ ] Test conditional item display based on external data (1.6.2 pattern) - NEW v1.3
- [ ] Test alternative evidence workflow (1.6.1.1 pattern) - NEW v1.3
- [ ] Test exclusion rule warnings (1.6.1.3 pattern) - NEW v1.3
- [ ] Test "not_applicable" status for non-selected scenarios - NEW v1.3
- [ ] Test OR group validation with multiple paths (2.1.4 pattern) - NEW v1.4
- [ ] Test assessment field workflow (YES/NO selections) - NEW v1.4
- [ ] Test intra-checklist conditional logic - NEW v1.4
- [ ] Test calculation formulas (division, multiplication, percentages) - NEW v1.4
- [ ] Test threshold validation (≥50% requirements) - NEW v1.4
- [ ] Test OR group with ANY operator (at least one path passes) - NEW v1.4
- [ ] Test OR group with ALL operator (all attempted paths must pass) - NEW v1.4

---

## Validation History

| Date | Indicator | Result | Changes Made |
|------|-----------|--------|--------------|
| 2025-01-12 | 1.1 BFDP Compliance (3 levels) | ✅ Can Build | Added grouped checklists, document counts, BBI associations |
| 2025-01-12 | 1.2 Innovations on Revenue Generation | ✅ Can Build (v1.1) | Extended MOV checklist to support input fields (currency, number, text, date), added comparison validation with warnings, clarified BLGU vs Validator data entry roles |
| 2025-01-12 | 1.3.1 Barangay Budget Approval | ✅ Can Build (v1.2) | Added support for mixed checklist types (checkbox + date input), implemented date deadline validation with grace periods, introduced "considered" status for grace period compliance, updated validation algorithm to return status tuple |
| 2025-01-12 | 1.4 Allocation for Statutory Programs | ✅ Can Build (v1.2) | No changes required - uses existing mixed types (checkbox + date input without deadline validation), multiple checkboxes pattern already supported |
| 2025-01-12 | 1.5 Posting of Barangay Citizens' Charter | ✅ Can Build (v1.2) | No changes required - simple checkbox with document count requirement (same pattern as 1.1.1) |
| 2025-01-12 | 1.6 SK Fund Release (ABYIP) | ✅ Can Build (v1.3) | **Major update**: Added support for mutually exclusive sub-indicators (selection_mode='one_of'), conditional checklist items (show/hide based on external data like SK Official count), alternative evidence system (bank statements instead of deposit slips), exclusion rules (SK Resolution not acceptable as MOV), introduced 'not_applicable' status for non-selected scenarios |
| 2025-01-12 | 1.7.1 Conduct of Barangay Assembly | ✅ Can Build (v1.3) | No changes required - simple single checkbox pattern (same as 1.5) |
| 2025-01-12 | 2.1 BDRRMC Functionality | ✅ Can Build (v1.4) | **Major update**: Added support for OR evidence paths within single indicator (Path A OR Path B satisfies requirement), assessment fields (YES/NO radio buttons for validator judgments), intra-checklist conditional logic (items depend on other items in same checklist), calculation formulas (auto-calculate utilization rates), threshold validation (≥50% requirements). Distinguished between mutually exclusive sub-indicators (v1.3) and OR evidence paths (v1.4). |
| 2025-01-12 | [Next indicator] | ⏳ Pending | - |

---

## Related Documentation

This Indicator Builder Specification serves as the **source of truth** for indicator structure and validation patterns. The following Product Requirements Documents (PRDs) reference and align with this specification:

### PRDs Aligned with This Specification

1. **[Phase 6: Administrative Features (MLGOO-DILG)](/docs/prds/prd-phase6-administrative-features.md)** (v1.1)
   - **Primary Use**: Admin tools for creating and managing indicators
   - **Key References**:
     - [Section 4.1.2 (Form Schema Builder)](/docs/prds/prd-phase6-administrative-features.md#412-form-schema-builder) - MOV checklist item catalog (9 types)
     - [Section 4.2.1 (BBI Definition Management)](/docs/prds/prd-phase6-administrative-features.md#421-bbi-definition-management) - Mandatory 9 BBIs
     - [Section 4.2.2 (Indicator-to-BBI Mapping)](/docs/prds/prd-phase6-administrative-features.md#422-indicator-to-bbi-mapping) - BBI functionality determination rules
     - [Appendix A](/docs/prds/prd-phase6-administrative-features.md#appendix-a-related-documents) - Specification reference
   - **What It Defines**: How MLGOO-DILG will configure indicators using the patterns defined in this specification

2. **[BLGU Table Assessment Workflow](/docs/prds/prd-blgu-table-assessment-workflow.md)** (v2.2)
   - **Primary Use**: BLGU submission and data collection interface
   - **Key References**:
     - [Section 4.2 (Assessment Interface)](/docs/prds/prd-blgu-table-assessment-workflow.md#42-assessment-interface-the-my-table-assessment-page) - BBI functionality indicator context
     - [Section 7.2 (Backend Logic)](/docs/prds/prd-blgu-table-assessment-workflow.md#72-backend-logic) - Technical implementation reference
     - [Section 9.3 (MOV Checklist Validation System)](/docs/prds/prd-blgu-table-assessment-workflow.md#93-mov-checklist-validation-system) - Comprehensive validation system documentation
   - **What It Defines**: How BLGUs submit data that will be validated using the MOV checklists defined in this specification

3. **[Assessor Validation & Rework Cycle](/docs/prds/prd-assessor-validation-rework-cycle.md)** (v1.1)
   - **Primary Use**: Assessor/Validator interfaces and validation workflow
   - **Key References**:
     - [Section 4.2 (Validation Module)](/docs/prds/prd-assessor-validation-rework-cycle.md#42-validation-module) - MOV checklist interface and "Considered" status
     - [Section 7 (Technical Considerations)](/docs/prds/prd-assessor-validation-rework-cycle.md#7-technical-considerations) - Technical specification reference
   - **What It Defines**: How Assessors/Validators use the MOV checklist validation patterns to review BLGU submissions

### Cross-Reference Summary

| Specification Section | Referenced By PRDs | Purpose |
|----------------------|-------------------|---------|
| **MOV Checklist Item Types** (9 types: checkbox, group, currency_input, etc.) | Phase 6 (4.1.2), BLGU Workflow (9.3), Assessor (4.2) | Defines the validation checklist structure |
| **BBI Functionality System** (9 mandatory BBIs) | Phase 6 (4.2.1, 4.2.2), BLGU Workflow (9.3), Assessor (4.2) | Documents BBI-indicator relationship |
| **Grace Period Validation** | Phase 6 (4.2.2), BLGU Workflow (9.3), Assessor (4.2.4, 4.2.10) | Defines "Considered" status determination |
| **OR Logic & Conditional Display** | Phase 6 (4.1.2), BLGU Workflow (9.3), Assessor (4.2.10) | Alternative evidence paths and dynamic validation |
| **Database Schema** | All PRDs (Technical sections) | Data model for indicators, MOV checklists, BBIs |
| **Validation Algorithms** | BLGU Workflow (7.2), Assessor (7) | Backend calculation logic |

### Key Concepts Defined in This Specification

- **form_schema**: BLGU input fields (what BLGUs see during submission)
- **MOV checklist items**: Assessor/Validator validation checklists (what Assessors use during review)
- **calculation_schema**: Backend logic for automatic status determination
- **BBI functionality determination**: One-way relationship (Indicator → BBI status)
- **Grace period validation**: Produces "Considered" status (equivalent to "Passed" with notation)
- **Selection mode**: 'all' (default) vs 'one_of' (mutually exclusive scenarios)
- **Validation statuses**: Passed, Considered, Failed, Not Applicable, Pending

### Validation History

This specification was validated against **29 real SGLGB indicators** (1.1-6.3) across 6 governance areas:
- Core 1: Financial Administration & Sustainability (1.1-1.7.1)
- Core 2: Disaster Preparedness (2.1-2.3)
- Core 3: Safety, Peace and Order (3.1-3.6)
- Essential 1: Social Protection (4.1-4.9)
- Essential 2: Business-Friendliness & Competitiveness (5.1-5.3)
- Essential 3: Environmental Management (6.1-6.3)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.4 | 2025-11-12 | **FINAL VALIDATION - 29 Indicators Complete**: Validated specification against all 29 SGLGB indicators (1.1-6.3) across 6 governance areas. **Added comprehensive BBI documentation** including 9 mandatory BBIs (BDRRMC, BADAC, BPOC, LT, VAW Desk, BDC, BCPC, BNC, BESWMC) with governance area mappings. **Corrected BBI relationship direction**: Indicator result → BBI functionality status (one-way, no cross-references). Added 200+ lines explaining "Understanding Cross-References and BBIs" with visual diagrams and code examples showing what we DON'T do vs what we DO. Updated BBI Functionality Tracking System section with correct database schema (`bbis.functionality_indicator_id` points TO indicator). Clarified grace period validation produces "Considered" status leading to "Functional" BBI status. Documented that BBIs are standalone - no indicators check other BBI statuses. Changed status from "Validation Phase" to "Validation Complete". This version represents the finalized specification aligned with actual DILG SGLGB requirements. |
| 1.3 | 2025-11-12 | **Major update based on indicator 1.6 validation**: Introduced **mutually exclusive sub-indicators** with selection_mode='one_of' (validator selects which scenario applies). Implemented **conditional checklist items** that show/hide based on external data (e.g., SK Official count) or user selections. Added **alternative evidence system** allowing substitute acceptable documents (e.g., bank statements instead of deposit slips) with consideration notes. Implemented **exclusion rules** to explicitly mark certain evidence as NOT acceptable with warnings. Added 'not_applicable' status for non-selected scenarios in mutually exclusive indicators. Extended MOVChecklistItem interface with condition, alternative_items, consideration_note, excluded_evidence, and exclusion_warning fields. Updated database schema with selection_mode, selected_scenario_id, conditional_data, and alternative_evidence_used columns. Created aggregate_one_of_parent_status function for mutually exclusive scenario aggregation. Enhanced validation algorithm with should_display_item helper function and alternative evidence checking. Added barangay conditional data API endpoint. Expanded validator workflow with scenario selector UI. Distinguished between time-based grace periods and evidence-based alternative acceptance. |
| 1.2 | 2025-11-12 | **Major update based on indicator 1.3.1 validation**: Added support for **mixed checklist types** (checkbox + input fields in same indicator). Implemented **date deadline validation** with grace periods (deadline + grace_deadline + consideration_note). Introduced new **"considered" status** - equal value to "passed" but indicates grace period compliance. Updated validation algorithm signature to return (is_valid, warnings, status) tuple with status being 'passed', 'considered', or 'failed'. Enhanced database schema to support 'considered' in indicator_validation_status enum. Updated all validation functions to propagate status correctly. Expanded frontend date input component with deadline information display, status badges (passed/considered/failed), and real-time validation feedback. Updated API response structure to include status field with all three possible values. |
| 1.1 | 2025-11-12 | **Major update based on indicator 1.2 validation**: Extended MOV checklist system to support input field types (currency_input, number_input, text_input, date_input) with validation rules. Added comparison validation logic that generates warnings but allows manual override. Updated validation algorithm to return (is_valid, warnings) tuple. Enhanced database schema with validation_warnings column. Updated API response structure to include warnings array. Expanded frontend components with input field renderers and warning UI. Clarified that BLGU users only upload files while validators enter data in input fields. |
| 1.0 | 2025-11-12 | Initial specification based on indicator 1.1 example. Added grouped checklists, document counting, and BBI association system. |

---

**END OF DOCUMENT**
