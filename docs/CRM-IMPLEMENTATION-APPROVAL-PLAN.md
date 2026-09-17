# CRM Implementation Approval Plan & Controlled Preparation

## Executive Summary
This document serves as the **controlled preparation plan** prior to commencing any backend database schema modifications, authentication integration, or server-side authorization refactoring for the CRM System (`C:\Users\user\.gemini\antigravity\scratch\crm-system`).

> [!IMPORTANT]
> **Controlled Preparation Status**: No database schema changes, database migrations, data alterations, package installations, or source code modifications have been made during the creation of this proposal.

---

## 1. Authentication Schema Proposal

### 1.1 Overview & Security Rules
- **No Plain-Text Passwords**: Passwords must **never** be stored as plain text under any circumstances.
- **`passwordHash` Naming**: The schema field is explicitly named `passwordHash` (not `password`) to prevent developer confusion.
- **Hashed Tokens**: Password reset tokens must be salted and hashed before storing in the database. Raw tokens exist only in memory during token generation and email dispatch.
- **No Client Exposure**: Sensitive authentication fields (`passwordHash`, `passwordResetTokenHash`) must be excluded from GraphQL/REST/Server Action client responses.
- **Public Signup Boundary**: Public self-registration strictly assigns `role = "EMPLOYEE"`. Admin accounts cannot be created via public signup and must be provisioned via a protected CLI seed script or secure setup environment variables.

### 1.2 Proposed `Employee` Model Changes

| Field Name | Purpose | Data Type | Required / Optional | Security Considerations | Exists in Current Schema? |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **`id`** | Unique employee identifier | `String @id @default(cuid())` | Required | System-generated CUID. | ✅ Yes |
| **`name`** | Full employee display name | `String` | Required | Standard user profile name. | ✅ Yes |
| **`email`** | Unique login & communication email | `String @unique` | Required | Must be normalized (lowercased) and validated server-side. | ❌ **No (MISSING)** |
| **`passwordHash`** | Salted password hash | `String` | Required | Salted hash generated using `bcrypt` (cost factor >= 10) or `argon2id`. Never exposed to client. | ❌ **No (MISSING)** |
| **`emailVerified`** | Email verification flag/timestamp | `Boolean @default(false)` | Required | Access restricted to `UNVERIFIED` accounts until link activation. | ❌ **No (MISSING)** |
| **`status`** | Account lifecycle status | `String @default("UNVERIFIED")` | Required | Values: `UNVERIFIED`, `ACTIVE`, `DISABLED`, `LOCKED`. Server checks status on every request. | ❌ **No (MISSING)** |
| **`passwordResetTokenHash`** | Hashed password reset token | `String?` | Optional | Salting/hashing single-use token prevents DB leak vulnerability. | ❌ **No (MISSING)** |
| **`passwordResetExpiresAt`** | Token expiration timestamp | `DateTime?` | Optional | Enforces single-use time window (e.g. 15-minute expiry). | ❌ **No (MISSING)** |
| **`role`** | System RBAC role | `String @default("EMPLOYEE")` | Required | Values: `EMPLOYEE`, `ADMIN`. Public signup hardcodes `EMPLOYEE`. | ⚠️ Partial (`role @default("USER")`) |
| **`createdAt`** | Creation timestamp | `DateTime @default(now())` | Required | System timestamp. | ✅ Yes |
| **`updatedAt`** | Modification timestamp | `DateTime @updatedAt` | Required | System auto-update timestamp. | ✅ Yes |

---

## 2. Soft Deletion Proposal

### 2.1 Proposed `Record` Model Changes
To align with the PRD soft-deletion policy without executing permanent database `SQL DELETE` statements, the following attributes are proposed for `model Record`:

- **`isDeleted`**: `Boolean @default(false)` — Flag indicating whether the record is soft-deleted/archived.
- **`deletedAt`**: `DateTime?` — Timestamp recording when the soft deletion occurred.
- **`deletedById`**: `String?` — Optional Employee ID referencing the user who soft-deleted the record (linked to `Employee` relation).

### 2.2 Operational Mechanics
1. **Normal Grid Queries**: All active workspace queries automatically append `WHERE isDeleted = false` (or `deletedAt IS NULL`), ensuring soft-deleted records never appear in normal workspace spreadsheet grids.
2. **Trash / Archived Views**: If enabled, a dedicated Trash view queries `WHERE workspaceId = x AND isDeleted = true`.
3. **Record Restoration**: Restoring a record executes `UPDATE Record SET isDeleted = false, deletedAt = null, deletedById = null`.
4. **Audit Logging**: Soft deletion writes an `ActivityLog` entry with `action = "RECORD_DELETED"`. Restoration writes `action = "RECORD_RESTORED"`.
5. **Fallback Strategy if Schema Changes are Not Approved**: If schema modifications are declined, soft deletion cannot be executed at the SQL level. Destructive `prisma.record.delete()` will be disabled in the UI, deletion buttons will trigger a "Soft Deletion Planned" banner, and existing records will be safely preserved.

---

## 3. Server-Side Authorization Plan

### 3.1 Authorization Rules Framework

#### Employee Rules
- Can access **only** their own assigned/owned workspace(s).
- Can view, create, edit, delete/archive, search, sort, filter, and import **ALL records** inside their authorized workspace.
- Cannot access or discover another employee's workspace.
- The record creator (`createdById`) is **not** the sole editor; any user with authorized access to a workspace can manage all records within that workspace (`createdById` is for historical audit logs only).

#### Admin Rules
- Possesses global authorization to access all employees, workspaces, records, fields, and activity logs.
- All Admin operations must create an `ActivityLog` entry tagged with `employeeId = AdminId`.
- Admin permissions must be validated server-side on every request.

### 3.2 Action-by-Action Server-Side Audit

| Server Action File | Action Function | Current Behavior | Required Authorization & Ownership Check | Risk if Check is Missing |
| :--- | :--- | :--- | :--- | :--- |
| **`records.ts`** | `updateRecord` | Checks `existingRecord.workspaceId === workspaceId`. | Verify `currentEmployeeId` owns `workspaceId` OR `role === "ADMIN"`. | **HIGH RISK**: Any authenticated user can modify records in any workspace if they guess/know `workspaceId`. |
| **`records.ts`** | `deleteRecord` | Checks `existingRecord.workspaceId === workspaceId` then calls `prisma.record.delete()`. | Verify workspace ownership/Admin role. Perform soft-delete (`isDeleted = true`). | **CRITICAL RISK**: Unprivileged users can permanently delete records from arbitrary workspaces. |
| **`records.ts`** | `createRecord` | Receives `workspaceId` and inserts record. | Verify `currentEmployeeId` owns `workspaceId` OR `role === "ADMIN"`. | **HIGH RISK**: Unauthorized record injection into foreign workspaces. |
| **`records.ts`** | `bulkCreateRecords` | Iterates and inserts multiple records for `workspaceId`. | Verify `currentEmployeeId` owns `workspaceId` OR `role === "ADMIN"`. | **HIGH RISK**: Mass data injection into arbitrary workspaces. |
| **`fields.ts`** | `addField` | Creates custom field for `workspaceId`. | Verify `currentEmployeeId` owns `workspaceId` OR `role === "ADMIN"`. | **MEDIUM RISK**: Schema tampering in foreign workspaces. |
| **`fields.ts`** | `renameField` | Updates custom field name. | Verify `currentEmployeeId` owns `workspaceId` OR `role === "ADMIN"`. | **MEDIUM RISK**: Foreign workspace column corruption. |
| **`fields.ts`** | `deleteField` | Deletes custom field. | Verify `currentEmployeeId` owns `workspaceId` OR `role === "ADMIN"`. | **HIGH RISK**: Data loss by deleting foreign workspace columns. |
| **`workspaces.ts`** | `renameWorkspace` | Checks `workspace.employeeId === employeeId`. | ✅ Already verifies workspace ownership. | **LOW RISK** (Properly protected). |
| **`workspaces.ts`** | `deleteWorkspace` | Checks `workspace.employeeId === employeeId`. | ✅ Already verifies workspace ownership. | **LOW RISK** (Properly protected). |

---

## 4. Approval Checklist

Review and confirm the following pending approval items prior to executing backend changes:

- [ ] **1. Approve Authentication Schema Changes**: Add `email`, `passwordHash`, `emailVerified`, `status`, `passwordResetTokenHash`, and `passwordResetExpiresAt` to `model Employee`.
- [ ] **2. Approve Soft Deletion Schema Changes**: Add `isDeleted Boolean @default(false)`, `deletedAt DateTime?`, and `deletedById String?` to `model Record`.
- [ ] **3. Approve Server-Side Authorization Refactoring**: Refactor all Server Actions in `records.ts` and `fields.ts` to enforce mandatory server-side workspace ownership and Admin role validation.
- [ ] **4. Confirm Password Hashing Library**: Select `bcrypt` (cost factor 10-12) or `argon2id` for password hashing.
- [ ] **5. Confirm Email Verification Provider**: Select email dispatch service (e.g., SMTP / SendGrid / Resend) for email verification and password reset links.
- [ ] **6. Confirm Role Storage Model**: Confirm storing `role` string (`"EMPLOYEE"`, `"ADMIN"`) directly on the `Employee` model.
- [ ] **7. Confirm Trash / Restore UI Scope**: Confirm whether soft-deleted records require a full Trash/Restore page in v1 or simple server-side filtering.

---

## 5. Recommended Safe Execution Order

1. **Step 1: Obtain Approvals** — Secure explicit approval for items 1–7 in the Approval Checklist.
2. **Step 2: Update Prisma Schema** — Apply proposed fields to `prisma/schema.prisma` without modifying existing schema structure.
3. **Step 3: Create & Inspect Migration** — Generate migration script (`npx prisma migrate dev --create-only`) and audit generated SQL.
4. **Step 4: Execute Migration** — Run migration (`npx prisma migrate deploy`) only after explicit review.
5. **Step 5: Implement Server-Side Authorization** — Update Server Actions in `records.ts` and `fields.ts` to enforce workspace ownership and Admin authorization.
6. **Step 6: Implement Authentication Flow** — Build Employee Signup, Login, Password Hashing, Session Cookies, Email Verification, and Admin Seed Provisioning.
7. **Step 7: Implement Soft Deletion Engine** — Update `records.ts` to execute soft deletes (`isDeleted = true`) and filter grid queries.
8. **Step 8: Perform Regression & Permission Testing** — Execute end-to-end authorization tests to verify strict workspace boundaries.
9. **Step 9: Complete UI Component Integration** — Finalize `RecordDrawer`, `#26215C` theme styling, and Admin Oversight Console.

---

## 6. Final Report & Inspections Audit

### 6.1 Exact Files Inspected
- [`prisma/schema.prisma`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/prisma/schema.prisma)
- [`src/app/actions/employees.ts`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/app/actions/employees.ts)
- [`src/app/actions/fields.ts`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/app/actions/fields.ts)
- [`src/app/actions/records.ts`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/app/actions/records.ts)
- [`src/app/actions/workspaces.ts`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/app/actions/workspaces.ts)
- [`docs/CRM-PRE-IMPLEMENTATION-TECHNICAL-AUDIT.md`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/docs/CRM-PRE-IMPLEMENTATION-TECHNICAL-AUDIT.md)

### 6.2 Proposed Files to Change (Post-Approval Only)
- `prisma/schema.prisma` (Schema additions for auth & soft-delete)
- `src/app/actions/records.ts` (Server-side authorization & soft-delete query filtering)
- `src/app/actions/fields.ts` (Server-side authorization checks)
- `src/app/actions/employees.ts` (Auth registration & verification actions)
- `src/lib/auth.ts` (New authentication session helper)

### 6.3 Separation of Confirmed Facts vs. Recommendations
- **Confirmed Fact 1**: `model Employee` in `prisma/schema.prisma` currently lacks `email`, `passwordHash`, `emailVerified`, `status`, and `passwordResetTokenHash` fields.
- **Confirmed Fact 2**: `model Record` in `prisma/schema.prisma` currently lacks `isDeleted` and `deletedAt` fields. Deleting a record calls `prisma.record.delete()`, which is a permanent SQL deletion.
- **Confirmed Fact 3**: Server Actions in `src/app/actions/records.ts` (`updateRecord`, `deleteRecord`, `createRecord`) do not check if `currentEmployeeId` owns `workspaceId` or is an Admin.
- **Recommendation**: Execute the 9-step recommended safe execution order only after all checklist items receive explicit approval.

### 6.4 Confirmation of Zero Modifications
- **Source Code Modified**: 0 files
- **Prisma Schema Modified**: 0 files
- **Database Data Altered**: 0 rows
- **Packages Installed/Removed**: 0 dependencies
- **Existing Behavior Changed**: None
