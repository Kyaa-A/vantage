### **Comprehensive Approach: Metadata-Driven Indicator Management & Evaluation**

The core of our strategy relies on a **metadata-driven architecture** where the definition and calculation rules for each indicator are stored as data, not hardcoded logic. This is precisely what provides the flexibility you're concerned about, making VANTAGE adaptable like Excel, but with the robustness and scalability of a structured system.

#### **Phase 1: Defining Indicators (MLGOO-DILG Administration - Epic 6)**

The MLGOO-DILG will use a dedicated administrative interface to create and edit indicators. This UI will be designed to capture all the complex metadata required.

1.  **Indicator Management UI (`MLGOO-DILG Admin Interface`):**
    - **Goal:** Allow MLGOO-DILG to define all aspects of an SGLGB indicator without developer intervention.
    - **Fields to Capture for each Indicator:**
      - `id`: System-generated unique identifier.
      - `name`: The indicator title (e.g., "1.1.1 Posted the following financial documents in the BFDP Board:").
      - `description`: The full "RELEVANCE / DEFINITION" text from the Technical Notes.
      - `governance_area_id`: Link to the relevant governance area (e.g., Financial Administration).
      - `parent_id`: For hierarchical indicators (e.g., `1.1.1` is child of `1.1`).
      - `is_active`: Boolean flag.
      - `is_profiling_only`: Boolean flag for indicators used only for profiling, not compliance (as seen in GAR sample).
      - **`form_schema` (JSONB):** This is the **blueprint for what the BLGU sees and inputs**. The MLGOO-DILG will use a specialized "form builder" UI to define this.
        - **Input Types:** The MLGOO will select input components (e.g., `CHECKBOX_GROUP`, `NUMBER_INPUT`, `DATE_PICKER`, `TEXT_INPUT`, `FILE_UPLOAD_REQUIRED_IF_YES`).
        - **Structure:** Define nested items, options for dropdowns/checkboxes, labels, and validation rules (e.g., min/max for numbers).
        - **MOV Requirement:** Crucially, the `form_schema` will specify _when_ an MOV is required (e.g., "MOV required if checkbox `X` is true").
      - **`calculation_schema` (JSONB):** This is the **blueprint for how the system _automatically_ determines the `Pass`/`Fail` (or `Conditional`) status** of this indicator. The MLGOO-DILG will use a "rule builder" UI to define this.
        - **Rule Types:** Define logic like `AND_ALL`, `OR_ANY`, `PERCENTAGE_THRESHOLD`, `COUNT_THRESHOLD`, `MATCH_VALUE`, `BBI_FUNCTIONALITY_CHECK`.
        - **Data References:** Rules will reference specific `field_ids` within the `response_data` (captured by `form_schema`).
        - **Output:** Define the resulting `Pass` or `Fail` status if conditions are met/not met.
        - **`Conditional` Availability:** A flag within `calculation_schema` will also indicate if "Conditional" is an allowable manual override for this specific indicator (as "not all MOVs/Indicators will have Conditional").
      - `technical_notes_text`: The full content from the "Technical Notes" document (Relevance, Minimum Requirements, Documentary Requirements). This will be displayed in-line to both BLGU and Assessors.

#### **Phase 2: BLGU Submission (Table Assessment - Phase 1)**

1.  **Dynamic Form Rendering (Frontend):**
    - The BLGU's "Table Assessment" page (SED) will fetch the list of indicators.
    - For each indicator, the frontend's `DynamicIndicatorForm` component will read the `form_schema` (defined by MLGOO).
    - It will **automatically render the appropriate input fields** (checkboxes for "Posted documents," number fields for "Total Estimated Revenue," date pickers, etc.) based on the `form_schema`.
    - The corresponding `technical_notes_text` will be displayed alongside the form for guidance.
2.  **Data Capture & MOV Submission:**
    - As the BLGU inputs data into these dynamically rendered fields, their responses will be stored as a `JSONB` object in `assessment_response.response_data`.
    - The MOV uploader will be presented based on the `form_schema`'s definition of required MOVs.

#### **Phase 3: Automated Calculation & Status Determination (Backend - Epic 4)**

1.  **The "Rule Engine" (`intelligence_service.py`):**
    - When the BLGU saves their progress or submits (and whenever an Assessor/Validator later takes action), the backend will trigger a generic `evaluate_indicator_status(indicator_id, assessment_response_data)`.
    - This function will:
      - Retrieve the `calculation_schema` for the given `indicator_id`.
      - Retrieve the `response_data` submitted by the BLGU.
      - **Execute the rules defined in the `calculation_schema`** against the `response_data`.
      - **Example (Indicator 3.2.3):** It would read the `physical_accomplishment_percent` and `fund_utilization_percent` from the `response_data`. It would then apply the `OR_CONDITION` from the `calculation_schema`: "Is `physical_accomplishment_percent` >= 50% OR `fund_utilization_percent` >= 50%?"
      - **Automatic `validation_status`:** The result (`Pass` or `Fail`) will be the **system-generated `validation_status`** for that `assessment_response`. This will initially populate the assessor's view.
    - This automated `validation_status` (and the presence of MOVs) will also feed into our `_recalculate_response_completeness` helper to update the `is_completed` flag for progress bars.

#### **Phase 4: Assessor/Validator Review (Table Assessment & Table Validation - Phase 1 & 2)**

1.  **Pre-populated Status:** The Assessor's/Validator's UI will display the **system-generated `validation_status`** for each indicator as a pre-selected choice in their radio buttons.
2.  **Human Override & Finality:** The Assessor/Validator will then visually compare the BLGU's submission, MOVs, and the `technical_notes_text`, and then **confirm, adjust, or override** the system's `validation_status` to `Pass`, `Fail`, or `Conditional`.
    - The option to select `Conditional` will only be visible and enabled if the `calculation_schema` for that indicator explicitly allows it.
    - This human input becomes the authoritative `validation_status` that drives `Rework`, `Calibration`, and `Finalize Validation`.

#### **Addressing Flexibility Concerns:**

- **"Formulas like Excel":** Our `calculation_schema` is precisely this. It's a structured way to define "formulas" (rules) in a machine-readable JSON format, dynamically applied by a generic engine, rather than hardcoded.
- **Data Types:** The `form_schema` will define the expected data types for input fields (number, date, text, boolean), and the backend will validate incoming `response_data` against these types.
- **MLGOO Control:** The MLGOO-DILG will have a powerful, code-free way to adapt the SGLGB rules as they evolve, directly controlling the input forms and the automated calculation logic.

**Yes, this is completely doable.** This approach ensures maximum flexibility, accuracy, and maintainability for handling all types of indicators within VANTAGE, making it truly an intelligent assessment platform.

---

### **Integration of Dynamic Indicator-Level Remarks**

**1. Where it fits in the Roadmap:**

This feature directly impacts **Epic 4: The Core Intelligence Layer** (for calculation) and **Epic 5: High-Level Analytics & Reporting** (for display). It also implicitly touches **Epic 6: Administrative Features** for defining _how_ these remarks are generated.

---

**2. Detailed Plan by Epic:**

#### **Epic 4: The Core Intelligence Layer (In Progress)**

This epic will be responsible for _generating_ these remarks.

- **New Requirement: `remark_schema` for Indicators:**
  - **Enhancement:** Within the `indicators` table, alongside `form_schema` and `calculation_schema` (or nested within `calculation_schema`), we need to add a **`remark_schema` (JSONB)** field. This schema will define the rules for generating a human-readable remark based on the calculated `validation_status` of the indicator and its children.
  - **Example `remark_schema` for Indicator 1.1 (Parent Indicator):**
    ```json
    {
      "type": "PARENT_AGGREGATE",
      "conditions": [
        {
          "evaluate": "all_children_pass",
          "output_template": "All requirements met for {indicator_name}."
        },
        {
          "evaluate": "has_associated_bbi",
          "then_evaluate_bbi_status": "BDRRMC", // Name of the BBI
          "output_template_functional": "{bbi_name} Functional.",
          "output_template_non_functional": "{bbi_name} Non-functional."
        },
        {
          "evaluate": "any_child_fail",
          "output_template": "Some requirements failed for {indicator_name}."
        }
      ],
      "default_output": "Status pending."
    }
    ```
- **Enhancement: Rule Engine Extension:**
  - The backend's `intelligence_service.py` (or `assessment_service.py`) will extend its `evaluate_indicator_status` function (or a new `generate_indicator_remark` function).
  - This function will now:
    1.  Evaluate the `calculation_schema` to get the `Pass`/`Fail`/`Conditional` status for the indicator (and its children, if it's a parent).
    2.  Read the `remark_schema` for the indicator.
    3.  Apply the `remark_schema`'s logic to the calculated statuses and associated BBI data (if any) to **generate the specific remark string**.
    4.  This generated remark string will be stored, likely as a new field `generated_remark` (VARCHAR) on the `assessment_responses` table (for the parent indicator) or a dedicated `indicator_remarks` table. This allows historical tracking.

#### **Epic 5: High-Level Analytics & Reporting (Not Started)**

This epic will be responsible for _displaying_ these remarks.

- **New Feature: Indicator-Level Remarks Display:**
  - The detailed assessment report page for the MLGOO-DILG (similar to the GAR sample) will be updated.
  - Next to each Level 1 (parent) indicator's status, the **`generated_remark` string** will be displayed prominently. This will provide the concise summary you've described ("All requirements," "[BBI name] Functional," etc.).
  - The MLGOO-DILG Dashboard might also display these remarks for quick scanning.

#### **Epic 6: Administrative Features (MLGOO-DILG) (Not Started)**

This epic will provide the UI for the MLGOO-DILG to _configure_ these remarks.

- **New Feature: `Remark Schema` Builder in Indicator Management:**
  - The Indicator Management CRUD interface will be extended with a specialized UI for defining the `remark_schema` for each indicator.
  - This "remark builder" will allow the MLGOO-DILG to configure the conditions and corresponding text templates (e.g., dropdowns for BBI names, text input for "output_template") without writing code. This ensures flexibility and MLGOO independence.
