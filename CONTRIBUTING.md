# Contributing Guidelines

## 1. Multi-tenant development rules

- **Always resolve scope first** using `resolveScopeIds(req)` or `applyScopeFilter(req, filter)` from `utils/scopeHelper.js`. Never trust `req.body.tenant_id` from the client for authorization decisions.
- **Attach `enforceTenantFilter`** to every new route that touches tenant data. Use the middleware options:
  - `includeDepartment: false` only when a model truly has no `department_id`.
  - `requireDepartment: true` for departmental modules (task workflow, safety, maintenance, warehouse).
  - `allowSystemBypass: false` if even System Admins must stay scoped (rare).
- **Repositories/services** used outside Express must still call `applyScopeFilter` with a synthetic request context to keep filters consistent.

## 2. Role levels & permission matrix

- Extend `PERMISSION_MATRIX` in `utils/permissions.js` for any new module/action pair. Add matching constants in `PERMISSIONS`.
- Every new role must define `role_level`, `scope_rules.tenant_scope`, and `scope_rules.department_scope`. See `docs/AUTHORIZATION_GUIDE.md` for accepted values.
- Add/adjust Jest coverage in `tests/unit/permissionMatrix.test.js` when touching the matrix to avoid silent regressions.

## 3. Data migration & seeding

- Create reversible scripts inside `scripts/` for seeding new tenant-aware collections. Each script must accept `DEFAULT_TENANT_ID` and fall back to `getDefaultTenantObjectId()` where possible.
- Document migration steps in `docs/ADMIN_MODULE_README.md` (or a new doc) and cross-link them from the README.
- Never run destructive migrations automatically on server boot; use `npm run db:seed:*` commands that ops can audit.

## 4. Testing expectations

- Unit tests are required for:
  - Middleware behaviour (authorization, tenant enforcement).
  - Permission/role helpers.
  - Controller “happy path” flows, using Jest mocks for models.
- Integration tests must cover at least one multi-tenant access scenario (`tests/integration/multiTenantAccess.test.js` shows the pattern). Use Supertest + the in-memory MongoDB provided by `tests/setup.js`.
- Run `npm test` before opening a PR. Attach coverage reports when changing RBAC or tenancy code.

## 5. Documentation & diagrams

- Update `README.md` for any new tenant/role/migration requirement.
- Expand `docs/MULTITENANT_OPERATION_FLOW.md` if the orchestration steps change.
- Record go-live requirements in `docs/QA_GO_LIVE_CHECKLIST.md` and keep them in sync with release notes.


