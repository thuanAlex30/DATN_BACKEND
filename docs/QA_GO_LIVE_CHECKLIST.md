# QA / Go-live Checklist

## Environment readiness
- [ ] `.env` contains `DEFAULT_TENANT_ID` and JWT/Kafka secrets.
- [ ] MongoDB migrations/seed scripts executed (`npm run db:seed:tenants`, module seeds).
- [ ] Feature flags toggled for trainer, safety, warehouse, maintenance modules.

## Functional verification
- [ ] Multi-tenant happy path: two tenants, cross-tenant reads/writes blocked (run `npm test -- tests/integration/multiTenantAccess.test.js`).
- [ ] RBAC smoke test: each critical role (System Admin, Company Admin, Department Header, Manager, Trainer, Safety Officer, Warehouse Staff, Maintenance Staff) can only reach authorized endpoints.
- [ ] Task workflow lifecycle: campaign → breakdown → assign → progress → log review.
- [ ] Trainer module lifecycle: session creation, assignment, assessment upsert.
- [ ] Safety escalation: report → checklist → escalation update.
- [ ] Warehouse & maintenance: stock movement, PPE request approval, maintenance job & log updates.

## Non-functional verification
- [ ] Jest unit suite clean (`npm test -- tests/unit`).
- [ ] Coverage threshold reviewed (`npm run test:coverage`).
- [ ] Linting (`npm run lint`) and TypeScript/ESLint gate (if applicable) pass.
- [ ] Logging & monitoring sinks configured (Winston transports, Kafka audit, Prometheus metrics).

## Release management
- [ ] README & CONTRIBUTING updated with any new tenant/migration guidance.
- [ ] Rollback plan documented (DB backups, feature flags, prior build artifacts).
- [ ] Post-deploy validation steps assigned to QA/on-call.


