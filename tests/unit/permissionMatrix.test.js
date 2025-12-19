const { PermissionUtils, ROLES } = require('../../utils/permissions');

describe('Permission matrix coverage', () => {
  it('allows trainers to manage training sessions via matrix', () => {
    const trainerRole = { role_code: ROLES.TRAINER, role_level: 60 };
    expect(
      PermissionUtils.hasMatrixPermission(trainerRole, 'trainer_module', 'sessions')
    ).toBe(true);
  });

  it('blocks employees from maintenance job updates', () => {
    const employeeRole = { role_code: ROLES.EMPLOYEE, role_level: 10 };
    expect(
      PermissionUtils.hasMatrixPermission(employeeRole, 'maintenance_module', 'jobs')
    ).toBe(false);
  });

  it('supports multi-module checks via hasAnyMatrixPermission', () => {
    const safetyOfficerRole = { role_code: ROLES.SAFETY_OFFICER, role_level: 70 };
    const allowed = PermissionUtils.hasAnyMatrixPermission(safetyOfficerRole, [
      { module: 'safety_module', action: 'reports' },
      { module: 'warehouse_module', action: 'stock' }
    ]);
    expect(allowed).toBe(true);
  });

  it('returns false for unknown modules/actions', () => {
    const managerRole = { role_code: ROLES.MANAGER, role_level: 80 };
    expect(
      PermissionUtils.hasMatrixPermission(managerRole, 'non_existing_module', 'read')
    ).toBe(false);
  });
});


