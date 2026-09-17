# Phase 2 Implementation Plan: Spreadsheet Workspace Grid Improvement

## 1. Files Inspected
- `src/app/workspaces/[workspaceId]/page.tsx` — Workspace route component, server-side data loading, empty state fallback.
- `src/app/workspaces/[workspaceId]/records-client.tsx` — Workspace layout, top header toolbar, search input, filter popover builder, active filter chips, export/import launchers.
- `src/app/workspaces/[workspaceId]/spreadsheet-grid.tsx` — Main 2D Spreadsheet Grid surface, inline cell editors, sticky headers/columns, auto-save status feedback, multi-draft row management, keyboard navigation (`Tab`, `Shift+Tab`, `Enter`, `Esc`).
- `src/app/workspaces/[workspaceId]/bulk-import-dialog.tsx` — Excel/Google Sheets copy-paste modal and column mapper.
- `src/app/actions/records.ts` — Server Actions for record creation, updates, deletes, and bulk imports.
- `src/lib/record-utils.ts` — Filter parsing and SQL query generator.

---

## 2. Current Grid Behavior
- **Grid Layout**: Bounded scroll container with sticky top headers (`sticky top-0 z-20`) and sticky left row index column (`sticky left-0 z-10`).
- **Inline Editing**: Double-click or single-click + type inline editing across 10 field types (`TEXT`, `NUMBER`, `EMAIL`, `PHONE`, `LONG_TEXT`, `DROPDOWN`, `MULTI_SELECT`, `CHECKBOX`, `DATE`, `URL`).
- **Keyboard Navigation**:
  - `Tab` / `Shift + Tab`: Commits cell and moves horizontally (right/left).
  - `Enter`: Commits cell and moves down to the same column in the next row (`rowIndex + 1`).
  - `Escape`: Cancels cell editing and restores original value.
- **Auto-Save & Feedback**: Edits commit on exit (`Tab`, `Enter`, `blur`) displaying debounced per-cell saving spinners, green checkmarks (`Saved`), or error alert badges with a **Retry** action button.
- **Multi-Draft Rows**: Clicking "+ New Record" appends independent draft rows to the top of the table simultaneously, maintaining isolated state and validation checks.
- **Bulk Copy/Paste**: Paste raw tab-delimited text (`Ctrl+V`) from Excel or Google Sheets.

---

## 3. Existing Functionality That MUST Be Preserved
- All inline cell editing handlers and state machines.
- `Tab`, `Shift+Tab`, `Enter`, and `Esc` keyboard movement.
- Auto-save triggers and error recovery (Retry action).
- Multiple draft row creation and validation checks.
- Excel/Google Sheets bulk paste parsing and mapping dialog.
- Search input, multi-column filter builder, header column sorting, and 25-row pagination.
- Existing record CRUD actions and workspace data isolation.

---

## 4. UI/UX Issues Identified & Improvements Planned for Phase 2
1. **Color Theme Alignment**: Update all grid toolbar controls, borders, cell focus rings, draft row highlights, and status badges to match the fixed theme:
   - **Primary Accent**: `#534AB7` (Selection ring & primary buttons)
   - **Hover State**: `#7F77DD`
   - **Pale Lavender Accent**: `#EEEDFE` (Draft row highlight & selected cell tint)
   - **Text on Accent**: `#3C3489`
   - **Borders**: `#E5E7EB`
   - **Main Background**: `#F8FAFC`
2. **Compact & Readable Grid Surface**:
   - Refine sticky header styling (`bg-[#F8FAFC]` with `#E5E7EB` borders and `#171717` font).
   - Refine sticky left index column (`sticky left-0 z-10`) with sharp contrast.
   - Refine selected cell state: crisp 2px `#534AB7` ring with soft `#EEEDFE` lavender tint.
   - Refine inline input editor: `#FFFFFF` background with `#534AB7` ring.
3. **Empty State & Toolbar**:
   - Update empty workspace fallback in `page.tsx` with `#534AB7` CTA button.
   - Standardize toolbar buttons in `records-client.tsx` with `#534AB7` primary actions and `#EEEDFE` active filter badges.

---

## 5. Proposed Files to Modify
- [`src/app/workspaces/[workspaceId]/spreadsheet-grid.tsx`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/app/workspaces/%5BworkspaceId%5D/spreadsheet-grid.tsx)
- [`src/app/workspaces/[workspaceId]/records-client.tsx`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/app/workspaces/%5BworkspaceId%5D/records-client.tsx)
- [`src/app/workspaces/[workspaceId]/page.tsx`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/app/workspaces/%5BworkspaceId%5D/page.tsx)

## 6. Proposed Files NOT to Modify
- `prisma/schema.prisma`
- `src/app/actions/*`
- `src/lib/prisma.ts`
- Database data / PostgreSQL

---

## 7. Risk Assessment
- **Risk Level**: `LOW`. Visual styling and layout adjustments only. Zero risk to database integrity or SQL query logic.

---

## 8. Testing Checklist
- [ ] Run `npx tsc --noEmit`
- [ ] Run `npm run lint`
- [ ] Run `npm run build`
- [ ] Verify inline grid editing across all 10 field types
- [ ] Verify `Tab`, `Shift+Tab`, `Enter`, `Esc` navigation
- [ ] Verify auto-save feedback badges (`Saving...`, `Saved`, `Error / Retry`)
- [ ] Verify multi-draft row creation and saving
- [ ] Verify Excel/Google Sheets copy-paste modal
- [ ] Verify global search, filters, sorting, and pagination
- [ ] Verify 2D sticky scrolling container on desktop and mobile

---

## 9. Schema & Database Confirmation
- **Confirmed**: Zero Prisma schema modifications, migrations, or database data resets are required for Phase 2.
