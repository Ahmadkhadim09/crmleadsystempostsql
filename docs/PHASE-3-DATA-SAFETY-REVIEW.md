# Phase 3: Data Safety & Migration Risk Review

## Executive Summary
This document provides a comprehensive **pre-implementation data safety review** for Phase 3 of the CRM System (`C:\Users\user\.gemini\antigravity\scratch\crm-system`). 

> [!IMPORTANT]
> **Safety Guarantee Status**: No database migrations, `prisma db push`, source code modifications, package installations, or data alterations have been executed.

---

## 1. Existing Data Inventory

### 1.1 Current Schema Models & Relations
- **`Employee`**:
  - Required fields: `id` (String CUID), `name` (String), `role` (String, default `"USER"`), `createdAt` (DateTime), `updatedAt` (DateTime).
  - Relations: `workspaces[]`, `records[]` (CreatedRecords), `updatedRecords[]` (UpdatedRecords), `activities[]`.
- **`Workspace`**:
  - Required fields: `id` (String CUID), `name` (String), `employeeId` (String FK -> `Employee.id`), `createdAt` (DateTime), `updatedAt` (DateTime).
  - Relations: `employee` (FK), `fields[]`, `records[]`.
- **`FieldDefinition`**:
  - Required fields: `id` (String CUID), `workspaceId` (String FK -> `Workspace.id`), `name` (String), `type` (String), `order` (Int), `isRequired` (Boolean), `createdAt`, `updatedAt`.
  - Constraints: Unique constraint on `[workspaceId, name]`.
- **`Record`**:
  - Required fields: `id` (String CUID), `workspaceId` (FK), `createdById` (FK -> `Employee.id`), `updatedById` (FK -> `Employee.id`), `data` (Json), `createdAt`, `updatedAt`.
- **`ActivityLog`**:
  - Required fields: `id` (String CUID), `recordId` (FK), `employeeId` (FK), `action` (String), `timestamp` (DateTime).

### 1.2 Data Integrity Assessment
- All existing `Workspace` rows have valid `employeeId` references.
- All existing `Record` rows have valid `workspaceId`, `createdById`, and `updatedById` foreign key references.
- Adding non-nullable columns without defaults to `model Employee` directly in PostgreSQL would trigger `NOT NULL` constraint violations on existing rows.

---

## 2. Authentication Migration Safety Matrix

| Proposed Field | Field Type | Proposed Default | Nullable / Required | Effect on Existing Employee Rows | Safe Backfill Strategy | Data Loss Risk | Risk Level |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **`email`** | `String` | None | **Nullable (`String?`) initially**, then `@unique` | Adding `@unique NOT NULL` directly would fail for existing rows. | Add as `String?` first -> Backfill unique dev emails (e.g. `employee_<id>@dev.local`) -> Add `@unique` constraint. | Zero Data Loss | **SAFE WITH BACKFILL** |
| **`passwordHash`** | `String` | None | **Nullable (`String?`) initially** | Required `passwordHash` column would crash without initial values. | Add as `String?` first -> Populate disabled hash placeholder (`"$DISABLED$"`) -> Require hash for new signups. | Zero Data Loss | **SAFE WITH BACKFILL** |
| **`role`** | `String` | `"EMPLOYEE"` | Required | Replaces existing `"USER"` default. Existing rows updated to `"EMPLOYEE"`. | Default value `"EMPLOYEE"` auto-populates. No user receives `"ADMIN"` automatically. | Zero Data Loss | **SAFE** |
| **`emailVerified`** | `Boolean` | `false` | Required | Pre-existing rows set to `false` or `true` via backfill. | Standard `@default(false)`. Dev rows can be set to `true` via backfill script. | Zero Data Loss | **SAFE** |
| **`status`** | `String` | `"ACTIVE"` | Required | Pre-existing rows automatically receive `"ACTIVE"`. | Standard `@default("ACTIVE")`. | Zero Data Loss | **SAFE** |
| **`passwordResetTokenHash`**| `String?` | `null` | Optional | No effect on existing rows (defaults to `null`). | No backfill needed. | Zero Data Loss | **SAFE** |
| **`passwordResetExpiresAt`**| `DateTime?` | `null` | Optional | No effect on existing rows (defaults to `null`). | No backfill needed. | Zero Data Loss | **SAFE** |

> [!SECURITY]
> **Strict Security Guarantees**:
> 1. Passwords will **never** be stored or handled as plain text; only salted hashes (`passwordHash`) are stored.
> 2. `email` will not be made mandatory without a non-destructive backfill strategy for existing rows.
> 3. No existing or newly registered user will ever receive the `"ADMIN"` role automatically; `EMPLOYEE` is the strict default.

---

## 3. Workspace and Record Safety Confirmation

We confirm:
- ✅ **Existing Workspace rows**: Remain 100% untouched.
- ✅ **Existing Record rows**: Data payloads (`data Json`) and timestamps remain 100% untouched.
- ✅ **Foreign Key Relations**: All `workspaceId`, `createdById`, and `updatedById` references remain intact.
- ✅ **Audit History**: Existing `createdBy` and `updatedBy` values are preserved for historical audit tracking.
- ✅ **No Deletions or Recreations**: Zero records or workspaces will be deleted, truncated, or recreated.
- ✅ **No Workspace Reassignment**: Workspace ownership will not be reassigned.

---

## 4. Recommended Migration Sequence

1. **Step 1: Backup & Verify Data Snapshot**
   - Verify PostgreSQL database connection and record count snapshots before any schema change.
2. **Step 2: Add Nullable & Defaulted Fields**
   - Update `prisma/schema.prisma` adding `email String?`, `passwordHash String?`, `role String @default("EMPLOYEE")`, `emailVerified Boolean @default(false)`, `status String @default("ACTIVE")`.
3. **Step 3: Execute Backfill Script**
   - Run a non-destructive backfill script to populate existing `Employee` rows with valid dev emails and placeholder password hashes.
4. **Step 4: Apply Schema Constraints**
   - Mark `email` as `@unique` after backfill validation.
5. **Step 5: Verify Row Counts**
   - Re-run database integrity checks to confirm row count parity pre- and post-migration.

---

## 5. Risk Classification Summary

| Proposed Change | Classification |
| :--- | :---: |
| Adding `role @default("EMPLOYEE")`, `emailVerified`, `status` | **SAFE** |
| Adding `passwordResetTokenHash`, `passwordResetExpiresAt` | **SAFE** |
| Adding `email` (Nullable first -> Unique) | **SAFE WITH BACKFILL** |
| Adding `passwordHash` (Nullable first -> Population) | **SAFE WITH BACKFILL** |
| Administrative user creation | **REQUIRES APPROVAL** |
| Executing `prisma migrate reset` or `db push --force-reset` | **BLOCKED** |

---

## 6. Final Decision & Implementation Boundary

- **Can Phase 3 safe implementation proceed?**: Yes, provided schema updates follow the two-stage optional-to-required backfill sequence.
- **Changes requiring approval**: Execution of schema migration against the production Neon PostgreSQL database.
- **Files to be modified later (post-approval)**:
  - `prisma/schema.prisma`
  - `src/lib/auth.ts`
  - `src/app/actions/auth.ts`
  - `src/app/actions/records.ts`
  - `src/app/actions/fields.ts`
  - `src/app/actions/workspaces.ts`
  - `src/app/login/page.tsx`
  - `src/app/signup/page.tsx`

---

## 7. Execution Safeguard Confirmation

- 🟢 **Source code changed**: 0 files
- 🟢 **Schema changed**: 0 files
- 🟢 **Database data changed**: 0 rows
- 🟢 **Packages changed**: 0 dependencies
- 🟢 **Seed script executed**: None
