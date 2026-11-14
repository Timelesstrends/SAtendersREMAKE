# SAtenderAI Firestore Security Specification & Red-Team Audit

## 1. Data Invariants
1. **Multi-Tenant Isolation**: A tender binder (`/companies/{companyId}/tenders/{tenderId}`), commercial document (`/companies/{companyId}/commercialDocs/{docId}`), and email audit log (`/companies/{companyId}/emailLogs/{logId}`) MUST belong to a valid `/companies/{companyId}` workspace. Only verified, active members of that company (`/companies/{companyId}/members/{request.auth.uid}`) or platform admins can read or mutate those sub-resources.
2. **RBAC Anti-Escalation**: A user joining an existing company via invite code may NOT self-assign `accessLevel == 'ADMIN'`. Only the workspace creator (`ownerUid == request.auth.uid` matching parent company) or an existing company `ADMIN` may hold/assign `ADMIN` privileges.
3. **POPIA & PII Isolation**: Personal user account records (`/users/{userId}`) containing `email`, `displayName`, and POPIA consent audit trails are readable and writable strictly by the owning user (`request.auth.uid == userId`) or platform admin, never by arbitrary signed-in users.
4. **Immutable Ownership & Identifiers**: `uid`, `companyId`, `ownerUid`, and document `id` fields are immutable across all updates.
5. **Verified Identity Enforcement**: All reads/writes require `request.auth != null && request.auth.token.email_verified == true`.

## 2. Dirty Dozen Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Read**: `get(/companies/co-1/tenders/t1)` with `auth: null` -> DENIED.
2. **Unverified Email Spoof**: Write `/users/uid-1` with `auth.token.email = 'austinmpapane97@gmail.com'`, `auth.token.email_verified = false` -> DENIED.
3. **Cross-Tenant Binder Exfiltration**: Company A member reads `/companies/co-B/tenders/t1` -> DENIED.
4. **Cross-Tenant List Scraping**: `list(/companies/co-B/commercialDocs)` by non-member -> DENIED.
5. **Privilege Escalation (Self-Admin)**: Employee B joins `/companies/co-A/members/uid-B` with `accessLevel: 'ADMIN'` when `ownerUid != uid-B` -> DENIED.
6. **Shadow Field Injection**: Update `/companies/co-A/tenders/t1` with extra ghost key `isSuperAdmin: true` -> DENIED (`keys().hasOnly(...)` / `affectedKeys().hasOnly(...)`).
7. **User PII Blanket Scraping**: User A calls `get(/users/uid-B)` or `list(/users)` -> DENIED.
8. **Invite Directory Enumeration**: Signed-in user calls `list(/inviteDirectory)` -> DENIED (`allow list: if false`).
9. **ID Poisoning / Buffer Exhaustion**: Create `/companies/co-A/tenders/${'x'.repeat(300)}` -> DENIED (`isValidId` <= 128 chars).
10. **Viewer Role Mutation**: Company member with `accessLevel: 'VIEWER'` attempts to update or delete a tender binder -> DENIED.
11. **Ownership Hijack**: Non-owner updates `/companies/co-A` changing `ownerUid` to attacker UID -> DENIED.
12. **Member Impersonation**: User A creates `/companies/co-A/tenders/t1` with `updatedByUid: 'uid-victim'` -> DENIED (`updatedByUid == request.auth.uid`).
