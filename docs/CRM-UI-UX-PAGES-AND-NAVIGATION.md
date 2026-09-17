# CRM UI/UX Pages & Navigation Specification v1

## 1. UX Principles
The CRM System is designed as a **spreadsheet-first commercial platform** for contact and lead management. It prioritizes data-entry speed, clarity, and grid interactivity while upholding strict multi-tenant authorization boundaries.

- **Spreadsheet-First Workflow**: The core working surface is an interactive 2D grid with rows representing records and columns representing system/custom fields.
- **Minimal Clicks**: Operations like editing, adding, and filtering occur inline directly inside the grid without requiring page transitions or heavy modal overlays.
- **Inline Cell Editing & Auto-Save**: Double-click or type into any cell to edit. Edits commit and auto-save on `Tab`, `Enter`, or cell exit (`blur`), displaying visual saving indicators (`Saving...`, `Saved`, `Error / Retry`).
- **Keyboard-Friendly Navigation**:
  - `Tab`: Commits edit and moves to the next column cell (right).
  - `Shift + Tab`: Commits edit and moves to the previous column cell (left).
  - `Enter`: Commits edit and moves down to the same column cell in the next row. (For `LONG_TEXT` fields, `Enter` inserts a newline; `Ctrl + Enter` commits).
  - `Arrow Keys`: Move focus between grid cells.
  - `Escape`: Cancels active cell edit and restores original value.
- **Clear & Enforced Permissions**:
  - Workspace ownership belongs to a single Employee owner in v1.
  - Employees can access, view, edit, delete, filter, search, and sort **ALL records inside their own workspace**, regardless of who created them (`createdBy` is used purely for audit history).
  - Employees manage custom fields exclusively inside their own workspace.
  - Admins possess global visibility and management authority across all workspaces, records, custom fields, and logs.
  - Public signup strictly creates Employee accounts. Admin accounts are provisioned via secure controlled setup processes (e.g. CLI seed commands / setup env vars).
- **Fixed Enterprise Palette**:
  - **Sidebar / Deep Indigo-Black**: `#26215C`
  - **Primary Accent**: `#534AB7`
  - **Hover / Lighter Accent**: `#7F77DD`
  - **Pale Lavender Accent Background**: `#EEEDFE`
  - **Text on Accent**: `#3C3489`
  - **Main Background**: `#F8FAFC`
  - **Cards / Table Surfaces**: `#FFFFFF`
  - **Main Text**: `#171717`
  - **Secondary Text**: `#64748B`
  - **Borders**: `#E5E7EB`

---

## 2. Public / Auth Pages

### 2.1 Overview & Security Rules
- **No Public Admin Signup**: Public signup forms strictly create `Employee` accounts. Users cannot select or assign themselves the `Admin` role.
- **Admin Provisioning**: Admin accounts are provisioned outside the public UI via a protected CLI seed script or secure setup configuration.

### 2.2 Page Specifications

#### A. Landing Page (`/`)
- **Purpose**: Brand introduction, key feature highlights (Spreadsheet CRM, Bulk Paste, Custom Fields), and CTA links for Employee Login & Signup.
- **Layout**: Top header with logo and action buttons; hero banner with spreadsheet interface graphic; feature grid; footer.
- **Actions**: "Log In" button (routes to `/login`), "Sign Up" button (routes to `/signup`).

#### B. Login Page (`/login`)
- **Purpose**: Authenticate returning Employees and Admins.
- **Fields**: `Work Email` (input), `Password` (password input with toggle visibility).
- **Buttons**: `Log In` (primary accent `#534AB7`), `Forgot Password?` (text link).
- **Validation & States**: Validates email format and non-empty password. Shows inline error for invalid credentials ("Invalid email or password").
- **Routing**: Successful login routes Employees to `/overview` or their active workspace `/workspaces/[id]`, and Admins to `/admin/overview`.

#### C. Employee Sign Up Page (`/signup`)
- **Purpose**: Self-service registration for new Employees.
- **Fields**: `Full Name`, `Work Email`, `Password`, `Confirm Password`.
- **Validation**: Minimum 8 chars, 1 uppercase, 1 number, 1 special character. Password matching check.
- **Security Notice**: Explicit notice stating that public signups create standard Employee accounts.
- **Routing**: On submission, creates account in `UNVERIFIED` status and redirects to `/verify-email-pending`.

#### D. Email Verification Pending (`/verify-email-pending`)
- **Purpose**: Inform newly registered employees to verify their email address before accessing workspaces.
- **Layout**: Centered card with email icon, resend link option, and back to login link.

#### E. Email Verification Handler (`/verify-email`)
- **Purpose**: Process incoming verification token link.
- **States**: Loading spinner ("Verifying your email..."), Success state ("Email verified! Proceed to login"), Token Expired state ("Link expired. Request new verification link").

#### F. Forgot Password (`/forgot-password`) & Reset Password (`/reset-password`)
- **Purpose**: Self-service password recovery for Employees.
- **Flow**: Enter registered work email -> receive single-use token link -> open `/reset-password?token=xyz` -> enter new password -> redirect to login upon success.

#### G. Unauthorized Page (`/unauthorized` / 403)
- **Purpose**: Rendered when a non-admin employee attempts to access an `/admin/*` route or another employee's private workspace.
- **Layout**: Clean error card with "Access Denied" message and a button returning the user to their own dashboard.

#### H. 404 & Global Error Pages
- **404 Page**: Rendered when workspace or record ID does not exist.
- **Global Error Boundary**: Displays user-friendly error message with a "Reload Page" or "Return to Safety" action button.

---

## 3. Employee Navigation

### 3.1 Sidebar & Header Navigation (`#26215C` Background)
The Employee Sidebar uses a dark indigo-black background (`#26215C`) with white/pale lavender items (`#EEEDFE`).

- **Global Navigation Items**:
  - **Company Overview**: `/overview` (Summary metrics, workspace list).
  - **My Workspaces**: Workspace list dropdown / expandable nav tree.
  - **Profile & Settings**: `/settings/profile` (Account, Security, Logout).
  - **Logout Action**: Clears session cookies and redirects to `/login`.
- **Workspace-Specific Navigation Items** (Active when inside `/workspaces/[id]`):
  - **Records Grid**: `/workspaces/[id]` (Spreadsheet View - Primary Interface).
  - **Custom Fields**: `/workspaces/[id]/settings` (Column Schema & Options Manager).
  - **Workspace Activity**: `/workspaces/[id]/activity` (Audit Trail for this workspace).

---

## 4. Employee Dashboard (`/overview`)
- **Welcome Header**: Displays logged-in employee name, active role (`Employee`), and quick date display.
- **Workspace Selector & Summary**:
  - Grid of owned workspace cards displaying workspace name, record count, custom field count, and last updated time.
  - "+ Create New Workspace" button launching a creation dialog.
- **Quick Metrics**: Total Owned Workspaces, Total Owned Lead Records, Recent Updates Count.
- **Recently Updated Records Table**: Displays the 5 most recently edited records across owned workspaces.
- **Recent Activity Feed**: Lists recent operations (`RECORD_CREATED`, `RECORD_UPDATED`, `BULK_IMPORTED`) generated within owned workspaces.
- **Empty State**: For new users with 0 workspaces, displays a welcome guide with a prominent "Create Your First Workspace" CTA button.

---

## 5. Workspace Spreadsheet Screen (`/workspaces/[id]`)

### 5.1 Screen Layout Architecture
- **Sidebar**: Left navigation pinned (collapsible on mobile).
- **Top Header Bar**:
  - Breadcrumbs: `Workspaces / [Workspace Name]`.
  - Workspace Selector dropdown.
  - Real-time Status Indicator: `Auto-saves on Tab / Enter / Blur` • `Sticky 2D Scrolling`.
- **Spreadsheet Control Toolbar**:
  - **Search Input**: Full-text instant search input with clear (`X`) button.
  - **Filter Button**: Opens filter popover builder (Filter chips displayed below toolbar when active).
  - **Sort Button**: Header column click or toolbar dropdown for single/multi-column sorting (`asc` / `desc`).
  - **Column Visibility Selector**: Toggle column display on/off.
  - **Bulk Paste / Import Button**: Launches Bulk Import Modal.
  - **Export Button**: Exports the currently active/filtered dataset to CSV format (`Export Filtered Records (CSV)`).
  - **Manage Fields Link**: Navigates to `/workspaces/[id]/settings`.
  - **+ New Record Button** (Primary Accent `#534AB7`): Appends a new blank draft row to the top of the spreadsheet grid.

### 5.2 Spreadsheet Grid Surface (`#FFFFFF` on `#F8FAFC` background)
- **Sticky Column 0 (#)**: Displays row index numbers pinned on the left (`sticky left-0 z-10`).
- **Sticky Header Row**: Column headers displaying field names, data types, and required asterisks (`*`), pinned at the top (`sticky top-0 z-20`).
- **Sticky Column Right (Actions)**: Quick action buttons (`Edit Drawer`, `Delete / Archive`) pinned on the right.
- **Grid Cells**:
  - Double-click or single-click + type to edit inline.
  - **Cell Selected State**: Bordered with a 2px `#534AB7` ring and `#EEEDFE` lavender tint.
  - **Cell Editing Input**: Solid white background with `#534AB7` focus ring.
  - **Draft Row State**: Highlighted with soft `#EEEDFE` lavender tint and a `+` badge in the row index cell.
  - **Saving Status Badges**: Inline spinner (`Saving...`), green checkmark (`Saved`), or red alert (`Error / Retry`).

### 5.3 Grid Interaction & Data Export Rules
- **View & Edit Scope**: Employee can view, edit, search, filter, sort, and delete/archive **ALL records in their workspace**, regardless of who created them.
- **CSV Export Rules**:
  - Exports the currently visible/filtered dataset.
  - If search is active, exports search results only.
  - If filters are active, exports filtered records only.
  - If sorting is active, preserves current sort order.
  - Includes currently visible columns in grid view.
  - Offers "Export All Records" only if supported natively by the existing backend without schema changes.
  - UI label explicitly communicates export scope (`Export Filtered Records (CSV)`).
- **Record Deletion & Soft-Delete Policy**:
  - Soft deletion policy for v1: Record deletion moves records out of active grid view rather than destroying data permanently.
  - Uses deleted/archived status using existing Prisma schema ONLY if schema already supports it. No schema modifications without approval.
  - If the existing schema lacks soft-delete fields, soft deletion is documented as a backend prerequisite, and destructive deletion is suppressed.
  - Confirmation modal explicitly explains: *"This record will be archived / moved to Trash instead of permanently deleted."*
  - Deleted records do not appear in normal workspace grid views.
  - If Trash UI cannot be backed by existing schema, feature displays as "planned" while preserving safe existing behavior.
- **New Record Multi-Row Creation**: Clicking "+ New Record" 3 times adds 3 separate blank draft rows to the top of the table simultaneously.
- **Duplicate Warning**: If a unique field constraint (e.g. Email) is violated, a duplicate warning badge appears without hard-blocking navigation; the user can choose to skip or resolve.
- **Horizontal Scroll**: Table container supports smooth 2D horizontal scrolling without breaking header alignment or page responsiveness.

---

## 6. Bulk Paste / Import Workflow

### 6.1 Modal Experience (`BulkImportModal`)
- **Launcher**: Triggered via "Bulk Paste / Import" button on the spreadsheet toolbar.
- **Paste Surface**: Large code/text area supporting raw `Ctrl+V` / `Cmd+V` from Excel or Google Sheets.
- **Parsing Logic**: Auto-parses tab characters (`\t`) as columns and newline characters (`\n`) as rows.
- **Guided Import Steps**:
  1. **Paste Raw Data**: User pastes tabular data into the text field.
  2. **Column Mapping**: Interactive mapping dropdowns matching pasted columns to workspace fields.
  3. **Data Preview & Validation**: Renders a preview table displaying mapped cells, highlighting missing required fields in red and duplicate rows in amber.
  4. **Import Confirmation**: Displays total rows to import (e.g., "Ready to import 85 records").
  5. **Result Summary**: On execution, shows success counts, partial failure warnings, and invalid row logs.

---

## 7. Record Details / Edit Experience

### 7.1 UX Approach Choice: Side Drawer (`RecordDrawer`)
- **Selected Approach**: **Right-Side Sliding Drawer** (380px - 480px width).
- **Rationale**: A side drawer maintains the user's spreadsheet grid location and scroll position in the background while providing an expanded view for complex multi-line text fields, complete field list forms, and historical activity logs.

### 7.2 Drawer Contents
- **Header**: Record title, record ID, and close (`X`) button.
- **Field Editors**: Structured form containing all system and custom fields with full inline validation.
- **Audit Metadata Block**:
  - `Created Date` & `Created By` (Employee name for audit history).
  - `Updated Date` & `Updated By`.
- **Activity History Timeline**: Embedded audit feed showing past record modifications.
- **Footer Actions**: `Save Changes` button, `Cancel` button, and `Delete / Archive Record` button (red accent triggering soft-delete confirmation modal).

---

## 8. Custom Fields Page (`/workspaces/[id]/settings`)

### 8.1 Employee Permissions (Own Workspace Only)
- Employees can manage custom fields strictly within their own workspace.
- **Actions Available**:
  - Add new custom fields.
  - Rename existing custom fields.
  - Delete custom fields (with impact warning modal).
  - Reorder column sequence via drag-and-drop or order arrows.
  - Toggle `Required` and `Unique` validation options.
  - Configure options for `DROPDOWN` and `MULTI_SELECT` field types.
- **Schema Isolation**: No forced global normalization across workspaces in v1. Each workspace maintains its own independent field schema.

### 8.2 Field Management Table
- Columns: `Field Name`, `Data Type`, `Required`, `Unique Check`, `Options Summary`, `Actions`.
- Interactive "+ Add Custom Field" drawer/dialog.

---

## 9. Activity Page (`/workspaces/[id]/activity`)
- **Purpose**: Comprehensive audit feed of all record operations within the workspace.
- **Filters**: Filter by Action Type (`CREATE`, `UPDATE`, `DELETE`, `BULK_IMPORT`), Date Range, and Search Query.
- **Table Columns**: `Timestamp`, `User (Created/Updated By)`, `Action`, `Record Context`, `Details / Diff`.

---

## 10. Profile and Settings (`/settings/profile`)
- **Account Info Card**: Displays employee full name, work email address, assigned role (`Employee`), and email verification status (`VERIFIED`).
- **Security Section**: Password change form (Current Password, New Password, Confirm New Password).
- **Session Management**: Lists active login sessions with a "Log Out All Devices" button.

---

## 11. Admin Navigation

### 11.1 Admin Sidebar (`#26215C` Background)
The Admin Sidebar contains global organization-wide items:
- **Overview**: `/admin/overview` (Executive KPIs, system metrics).
- **Employees**: `/admin/employees` (Employee accounts, status controls).
- **Workspaces**: `/admin/workspaces` (Global workspace index).
- **All Records**: `/admin/records` (Cross-workspace global lead search & export).
- **Activity Logs**: `/admin/activity` (Organization-wide audit logs).
- **System Reports**: `/admin/reports` (Usage trends, data stats).
- **Settings**: `/admin/settings` (Global security policies).
- **Profile**: `/admin/profile`.

---

## 12. Admin Pages

### 12.1 Admin Overview (`/admin/overview`)
- **Executive Metric Cards**: Total Employees, Total Workspaces, Total Lead Records, Total Activity Volume.
- **Employee Accounts Table**: Lists all registered employees, status (`Active` / `Disabled`), workspace count, and account toggle switches.
- **Recent System Activity Log**: Global feed of cross-workspace operations.

### 12.2 Admin Workspace Spreadsheet View (`/admin/workspaces/[id]`)
- **Banner Indicator**: Displays a prominent top notice bar: `⚠️ Viewing as Admin — Full Override Mode`.
- **Full Operational Capabilities**: Admin can view, edit inline, add records, delete records, and modify custom fields in **any employee workspace**.
- **Logging**: All Admin edits are tagged in activity logs with `Actor = Admin`.

---

## 13. Permission-Based UI Behavior (Permission Matrix)

| UI Action / Feature | Employee Role (Own Workspace) | Employee Role (Other Workspaces) | Admin Role (Any Workspace) |
| :--- | :---: | :---: | :---: |
| **Public Signup / Register** | ✅ Allowed (`Employee`) | ❌ N/A | ❌ (Controlled Setup Only) |
| **View Workspace Spreadsheet** | ✅ Allowed | ❌ 403 Blocked | ✅ Allowed |
| **View All Workspace Records** | ✅ Allowed | ❌ 403 Blocked | ✅ Allowed |
| **Inline Grid Edit (Any Record)** | ✅ Allowed | ❌ 403 Blocked | ✅ Allowed |
| **Add Multi-Draft Rows** | ✅ Allowed | ❌ 403 Blocked | ✅ Allowed |
| **Delete / Archive Workspace Record** | ✅ Allowed | ❌ 403 Blocked | ✅ Allowed |
| **Bulk Paste from Excel / Sheets** | ✅ Allowed | ❌ 403 Blocked | ✅ Allowed |
| **Manage Custom Fields** | ✅ Allowed | ❌ 403 Blocked | ✅ Allowed |
| **Export Filtered Records to CSV** | ✅ Allowed | ❌ 403 Blocked | ✅ Allowed |
| **View Workspace Activity Logs** | ✅ Allowed | ❌ 403 Blocked | ✅ Allowed (Global Logs) |
| **Manage Employee Accounts** | ❌ 403 Blocked | ❌ 403 Blocked | ✅ Allowed |
| **View Executive Reports & Stats** | ❌ 403 Blocked | ❌ 403 Blocked | ✅ Allowed |

---

## 14. Shared UI States

1. **Loading State**: Skeleton loaders for grid rows, metric cards, and sidebar nav.
2. **Empty State**: Customized graphic cards with actionable CTA buttons for empty workspaces, search results, or filter sets.
3. **Error State**: Inline alert banners with retry buttons (`Error saving cell. Retry`).
4. **Success State**: Floating toast notification (`Record saved successfully`, `85 rows imported`).
5. **Saving / Saved State**: Per-cell spinner (`Saving...`) transitioning to green checkmark (`Saved`).
6. **Validation Error State**: Red cell borders with hover tooltips detailing missing required fields or invalid formats.
7. **Permission Denied (403)**: Centered card redirecting users back to accessible workspaces.
8. **Session Expired**: Modal prompting user to re-authenticate without losing current grid edit buffer.
9. **Duplicate Warning**: Amber highlight and warning popover offering "Skip" or "Ignore & Save" options.

---

## 15. Responsive Behavior

- **Desktop (>= 1024px)**: Full sidebar navigation, 2D scrollable spreadsheet grid with sticky headers and pinned action columns, right-side sliding record drawer.
- **Tablet (768px - 1023px)**: Collapsible sidebar, horizontal scroll grid container, full-width modal drawers.
- **Mobile (< 768px)**:
  - Top header with hamburger menu opening mobile navigation drawer.
  - Spreadsheet grid enables touch horizontal scrolling with sticky row index.
  - Toolbar controls stack vertically into collapsible filter/search drawers.
  - Bulk import modal converts to full-screen wizard.

---

## 16. Component Inventory

1. `AppShell`: Layout container combining Topbar, Sidebar, and Content Main region.
2. `Sidebar`: Navigation panel supporting dark `#26215C` indigo styling and active workspace links.
3. `Topbar`: Breadcrumb, search, workspace switcher, and user status header.
4. `WorkspaceSelector`: Dropdown component for switching between accessible workspaces.
5. `SpreadsheetToolbar`: Action bar hosting Search, Filter, Sort, Column selector, Export CSV button, Bulk Import button, and New Record button.
6. `SpreadsheetGrid`: 2D table grid with sticky top headers, sticky left index column, and sticky right action buttons.
7. `EditableCell`: Cell renderer supporting inline editing, field type controls (Input, Date, Dropdown, Checkbox), and auto-save status.
8. `RecordDrawer`: Right-side slide-over panel for full record inspection, editing, and audit history.
9. `BulkImportModal`: Guided wizard for Excel/Google Sheets copy-pasting, column mapping, validation, and batch insertion.
10. `FilterBuilder`: Popover builder for multi-column filter criteria.
11. `SortMenu`: Popover for header column sorting (`asc` / `desc`).
12. `FieldManager`: Table and modal system for managing custom fields (Add, Rename, Delete, Reorder, Options).
13. `ActivityTimeline`: Feed displaying audit log events (`CREATE`, `UPDATE`, `DELETE`).
14. `ConfirmDialog`: Reusable alert modal for destructive/soft-delete actions like record or field deletion.
15. `ToastSystem`: Floating feedback messages for success, error, and system warnings.

---

## 17. Navigation Flows

1. **New Employee Signup**: Public Signup (`/signup`) -> Verification Pending (`/verify-email-pending`) -> Email Link (`/verify-email`) -> Login (`/login`) -> Overview (`/overview`) -> First Workspace Grid (`/workspaces/[id]`).
2. **Existing Employee Login**: Login (`/login`) -> Workspace Grid (`/workspaces/[id]`).
3. **Add Multiple Records**: Grid View -> Click "+ New Record" 3 times -> 3 blank draft rows appear -> Type cell data -> Press `Tab` / `Enter` -> Cells auto-save to DB with green checkmarks.
4. **Bulk Paste Workflow**: Grid View -> Click "Bulk Paste / Import" -> Paste Excel data (`Ctrl+V`) -> Confirm Column Mapping -> Preview & Validate -> Click "Execute Import" -> Grid refreshes with imported records.
5. **Add Custom Field**: Grid View -> Click "Manage Fields" -> Open `/workspaces/[id]/settings` -> Click "+ Add Custom Field" -> Configure Name & Type -> Save -> Return to Grid -> New column appears.
6. **Admin Workspace Audit**: Admin Login (`/login`) -> Admin Overview (`/admin/overview`) -> Select Workspace -> Open `/admin/workspaces/[id]` -> Displays `⚠️ Viewing as Admin` banner -> Admin edits or reviews records.

---

## 18. Implementation Guardrails

The following strict rules govern all future implementation work:

1. **No Public Admin Signup**: Public registration endpoints strictly assign `Role = EMPLOYEE`. Users cannot select or assign themselves the `Admin` role.
2. **No Client-Side-Only Authorization**: UI component visibility toggles must be backed by strict server-side authorization checks on every API route and Server Action.
3. **Server-Side Permission Enforcement**: All permissions must be re-verified on the server for every protected route and action.
4. **All-Record Workspace Access**: An Employee can view, edit, delete, search, filter, sort, and manage **ALL records** inside their owned workspace.
5. **Audit-Only Record Creator (`createdBy`)**: The record creator is not the only person allowed to edit a record; `createdBy` is preserved strictly for historical audit logs.
6. **Workspace-Specific Custom Fields**: Custom fields belong exclusively to the workspace in which they are created.
7. **Manual Admin Field Management**: Admins can manually manage custom fields in any workspace when necessary.
8. **No Forced Schema Normalization**: No automatic or forced global custom field schema normalization across workspaces in v1.
9. **No Unapproved Schema Changes**: Do not modify the Prisma schema or database model without explicit prior approval.
10. **Preserve Core Spreadsheet Engine**: Do not break or regress existing spreadsheet grid rendering, 2D scrolling, keyboard navigation, inline auto-save, multi-draft row creation, or bulk import workflows.
11. **No Fake Controls**: Do not render non-functional controls or decorative placeholder buttons.
12. **Complete State Definition**: Every screen component must explicitly handle Loading, Empty, Error, Success, Saving, Saved, Validation Error, and Permission Denied (403) states. Keep the interface compact, professional, responsive, and spreadsheet-first.

---

## 19. Recommended Implementation Order

- **Phase 0: Baseline & Schema Verification**
  - Confirm current Prisma schema capabilities and soft deletion field support.
  - Verify current spreadsheet grid, inline auto-save, multi-draft row, and bulk import functionality.
  - Do not make database schema changes during this phase.

- **Phase 1: Design System & Layout Foundation**
  - Standardize UI design tokens and global AppShell layout wrapper using the fixed `#26215C` indigo palette.
  - Preserve all existing functionality without regressions.

- **Phase 2: Spreadsheet Grid & Editable Cell Refinement**
  - Refine `SpreadsheetGrid` and `EditableCell` components.
  - Ensure robust sticky top headers (`sticky top-0 z-20`) and sticky left index columns (`sticky left-0 z-10`).
  - Preserve 2D scrolling, keyboard navigation (`Tab`, `Shift+Tab`, `Enter`, `Esc`), multi-draft rows, and auto-save feedback badges.

- **Phase 3: Record Details Drawer (`RecordDrawer`)**
  - Implement and refine `RecordDrawer` side panel.
  - Support comprehensive field editing, audit metadata, history timeline, validation, and safe soft-deletion confirmation dialogs.

- **Phase 4: Bulk Import Modal (`BulkImportModal`)**
  - Implement/refine `BulkImportModal`.
  - Support Excel and Google Sheets tab-separated (`\t`) and newline-separated (`\n`) copy-pasting.
  - Include interactive column mapping, validation preview, duplicate detection warnings, and execution summary.

- **Phase 5: Workspace Field Manager (`FieldManager`)**
  - Implement `FieldManager` interface for managing workspace custom fields.
  - Enforce workspace-specific custom field permissions with zero automatic global schema normalization.

- **Phase 6: Employee Pages & Navigation Integration**
  - Implement Employee Dashboard (`/overview`), workspace switcher, active filter displays, and profile settings.

- **Phase 7: Admin Oversight Console (`/admin/*`)**
  - Implement Admin Overview, Employee management table, Workspace global index, Cross-workspace record viewer, Activity logs, and `⚠️ Viewing as Admin` banner indicators.

- **Phase 8: Comprehensive QA & Regression Testing**
  - Perform responsive layout testing (Desktop, Tablet, Mobile), accessibility validation, server-side permission checks, and end-to-end workflow regression testing.

---

## 20. Resolution of Open Questions

1. **CSV Export Scope (Resolved)**:
   - CSV export exports the currently visible/filtered dataset.
   - If search keyword is active, exports search results only.
   - If filters are active, exports filtered records only.
   - If column sort is active, preserves current sort order.
   - Export includes currently visible columns in grid view.
   - "Export All Records" is offered only if natively supported by the existing backend without schema or API expansion.
   - UI button label explicitly communicates export scope: `Export Filtered Records (CSV)`.

2. **Record Deletion & Soft-Delete Policy (Resolved)**:
   - Soft deletion policy adopted for v1. Record deletion moves records out of active grid view rather than destroying data permanently.
   - Uses deleted/archived status from existing Prisma schema ONLY if schema already supports it. No schema modifications without approval.
   - If the existing schema lacks soft-delete fields, soft deletion is documented as a backend prerequisite, and destructive deletion is suppressed.
   - Confirmation modal explicitly explains: *"This record will be archived / moved to Trash instead of permanently deleted."*
   - Deleted records do not appear in normal workspace grid views.
   - If Trash UI cannot be backed by existing schema, feature displays as "planned" while preserving safe existing behavior.
