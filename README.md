"# DATN_BACKEND" 
<<<<<<< HEAD
=======

## Multi-tenant bootstrap (Priority 1)

1. Run `npm run db:seed:tenants` to create the default tenant, seed the 10 standardized roles, and backfill existing collections with `tenant_id`.
2. Set the `.env` variable `DEFAULT_TENANT_ID=<output_id>` (shown after the seed script finishes). Optional: override `DEFAULT_TENANT_CODE`, `DEFAULT_TENANT_NAME`, or `DEFAULT_TENANT_BOOTSTRAP_PASSWORD`.
3. Restart the backend so new schemas (tenant-aware models and role fields) are applied.

After seeding you will have two helper accounts for verification:
- `company.admin@default-tenant.local` (role: Company Admin)
- `dept.header@default-tenant.local` (role: Department Header)

Both accounts use the bootstrap password `ChangeMe123!` unless `DEFAULT_TENANT_BOOTSTRAP_PASSWORD` is set.

## Tenant & Department Enforcement (Priority 5)

- Middleware `middlewares/enforceTenantFilter.js` is attached to trainer, safety, warehouse, maintenance and task-workflow routes. It injects `{ tenant_id, department_id }` into every read/write payload and exposes `req.applyTenantFilter()` plus `req.scopeContext` for controllers/services.
- `utils/scopeHelper.js` offers `resolveScopeIds()` and `applyScopeFilter()` helpers so any new service can stay tenant-safe even outside Express.
- System Admins can bypass enforced filters by design; all other roles require a resolved tenant (and optionally department) before queries execute.

## Role Levels & Scope Rules

- Permission matrix coverage is validated via Jest in `tests/unit/permissionMatrix.test.js`.
- Scope-aware middleware tests live in `tests/unit/enforceTenantFilter.test.js` and `tests/unit/authorizeScope.test.js`.
- For a full explanation of role levels (10–100), tenant/department scopes (`global`, `tenant`, `self` / `all`, `hierarchy`, `own`) and the migration path for new roles, read `docs/AUTHORIZATION_GUIDE.md`.

## Testing & QA

- Run **unit tests**: `npm test -- tests/unit`
- Run the **multi-tenant integration suite**: `npm test -- tests/integration/multiTenantAccess.test.js`
- Full coverage: `npm run test:coverage`
- QA/go-live checklist is tracked in `docs/QA_GO_LIVE_CHECKLIST.md` (data migration, RBAC smoke tests, observability, rollback).

## Process Flow Diagram

The end-to-end flow from tenant creation → role assignment → task workflows → reporting → warehouse/maintenance feedback loops is documented (with a Mermaid diagram) in `docs/MULTITENANT_OPERATION_FLOW.md`.
>>>>>>> origin/main
