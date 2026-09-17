# Phase 3: Authentication, User Roles, and Server-Side Authorization Plan

## 1. Files Inspected
- [`prisma/schema.prisma`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/prisma/schema.prisma)
- [`src/app/actions/employees.ts`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/app/actions/employees.ts)
- [`src/app/actions/workspaces.ts`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/app/actions/workspaces.ts)
- [`src/app/actions/records.ts`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/app/actions/records.ts)
- [`src/app/actions/fields.ts`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/app/actions/fields.ts)
- [`package.json`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/package.json)

---

## 2. Current Authentication Status
- Currently, the CRM uses an unauthenticated cookie `current_employee_id` or falls back to `prisma.employee.findFirst()`.
- `model Employee` in `prisma/schema.prisma` lacks `email`, `passwordHash`, `emailVerified`, and `status`.
- The `role` column on `Employee` currently defaults to `"USER"` instead of `"EMPLOYEE"`.
- Server Actions in `records.ts` and `fields.ts` do not perform server-side session authentication or workspace authorization checks.

---

## 3. Required Schema Changes

> [!IMPORTANT]
> **Schema Change Proposal**: Per project safety rules, the schema modifications below require confirmation before applying `prisma db push` or migrations.

### Proposed Changes to `model Employee` in `prisma/schema.prisma`:
```prisma
model Employee {
  id                      String    @id @default(cuid())
  name                    String
  email                   String    @unique
  passwordHash            String
  role                    String    @default("EMPLOYEE") // Values: "EMPLOYEE", "ADMIN"
  emailVerified           Boolean   @default(false)
  status                  String    @default("ACTIVE")   // Values: "ACTIVE", "UNVERIFIED", "DISABLED"
  passwordResetTokenHash  String?
  passwordResetExpiresAt  DateTime?
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  workspaces              Workspace[]
  records                 Record[]      @relation("CreatedRecords")
  updatedRecords          Record[]      @relation("UpdatedRecords")
  activities              ActivityLog[]
}
```

### Proposed Changes to `model Record` (Soft-delete alignment):
```prisma
model Record {
  id          String   @id @default(cuid())
  workspaceId String
  createdById String
  updatedById String
  data        Json
  isDeleted   Boolean  @default(false)
  deletedAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  ...
}
```

---

## 4. Required Dependencies & Tech Stack
- **Option A (Zero external npm packages)**: Use Node.js native `crypto` module (`pbkdf2Sync` / `scryptSync`, `crypto.randomBytes`, `HMAC-SHA256`) for secure password hashing and signed HTTP-only cookies.
- **Option B**: Install `bcryptjs` and `jose` if third-party packages are approved.

---

## 5. Session Strategy
- **HTTP-Only Cookie**: `crm_session` cookie containing a signed payload `{ employeeId, role, expiresAt }`.
- **Server Utility**: `src/lib/auth.ts` providing `getSession()` and `requireAuth()`.
- **Session Expiry**: 7-day rolling duration with server-side validation.

---

## 6. Password Hashing Strategy
- Passwords stored strictly as salted hashes (`salt:hash`).
- Native Node `crypto.pbkdf2Sync` (100,000 iterations, sha512) or `bcryptjs`.
- Never expose `passwordHash` to client components or responses.

---

## 7. Admin Provisioning Strategy
- **No Public Signup**: Public `/signup` route hardcodes `role = "EMPLOYEE"`. User cannot select `ADMIN`.
- **CLI / Seed Script**: `scripts/seed-admin.ts` or CLI command reading `ADMIN_EMAIL` and `ADMIN_PASSWORD` from environment variables.
- Credentials will never be printed in logs or hardcoded in source files.

---

## 8. Server-Side Authorization Strategy
Refactor all Server Actions (`records.ts`, `fields.ts`, `workspaces.ts`):
1. Resolve session user server-side via `getSession()`. Reject if unauthenticated.
2. Verify workspace access:
   - Allow if `workspace.employeeId === session.employeeId`
   - Allow if `session.role === "ADMIN"`
   - Otherwise reject with `{ success: false, error: "Unauthorized access to this workspace" }`.
3. Verify target record belongs to requested workspace before update/delete.

---

## 9. Migration Risks & Backfill Strategy
- **Risk**: Adding non-nullable `email` and `passwordHash` columns to `Employee` when existing records exist.
- **Safe Backfill Strategy**:
  1. Add columns as optional (`String?`) first, or supply temporary system backfill values for existing dev records.
  2. Populate admin account with valid credentials.
  3. Ensure zero data loss for existing Workspaces and Records.

---

## 10. Proposed Files to Modify & Create

### New Files:
- [`src/lib/auth.ts`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/lib/auth.ts) (Session helper & auth utilities)
- [`src/app/actions/auth.ts`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/app/actions/auth.ts) (Signup, Login, Logout actions)
- [`src/app/login/page.tsx`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/app/login/page.tsx) (Login page)
- [`src/app/signup/page.tsx`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/app/signup/page.tsx) (Employee Signup page)
- [`scripts/seed-admin.ts`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/scripts/seed-admin.ts) (Admin CLI seed script)

### Files to Modify:
- [`prisma/schema.prisma`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/prisma/schema.prisma)
- [`src/app/actions/records.ts`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/app/actions/records.ts)
- [`src/app/actions/fields.ts`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/app/actions/fields.ts)
- [`src/app/actions/workspaces.ts`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/app/actions/workspaces.ts)
- [`src/components/AppSidebarClient.tsx`](file:///c:/Users/user/.gemini/antigravity/scratch/crm-system/src/components/AppSidebarClient.tsx) (User profile & Logout button)

---

## 11. Testing & Verification Checklist
1. TypeScript compilation: `node typescript/lib/tsc.js -p tsconfig.json --noEmit`
2. Production build: `npm run build`
3. Signup test: New employee registration -> Creates employee & workspace -> Logs in.
4. Login test: Valid credentials succeed, invalid credentials fail with safe message.
5. Isolation test: Employee cannot access foreign workspace URL or mutate foreign records.
6. Admin test: Admin can access any workspace.
7. Regression test: Grid editing, Enter/Tab, auto-save, draft rows, paste features all functioning cleanly.
