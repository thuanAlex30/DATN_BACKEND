jest.mock('../../models/trainingSession', () => ({
  TrainingSession: {
    find: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn()
  }
}));

jest.mock('../../models/trainingAssignment', () => ({
  find: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn()
}));

jest.mock('../../models/trainingAssessment', () => ({
  TrainingAssessment: {
    find: jest.fn(),
    findOneAndUpdate: jest.fn()
  },
  ASSESSMENT_STATUSES: ['PASS', 'FAIL']
}));

const { TrainingSession } = require('../../models/trainingSession');
const TrainingAssignment = require('../../models/trainingAssignment');
const { TrainingAssessment } = require('../../models/trainingAssessment');
const TrainerModuleController = require('../../controllers/trainerModuleController');

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

describe('TrainerModuleController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists sessions using scoped filters', async () => {
    const sortMock = jest.fn().mockResolvedValue([]);
    TrainingSession.find.mockReturnValue({ sort: sortMock });

    const req = {
      query: {},
      params: {},
      user: { tenant_id: 'tenant-1' },
      scopeContext: { tenant_id: 'tenant-1', department_id: 'dept-1' },
      applyTenantFilter: jest.fn(() => ({ tenant_id: 'tenant-1', department_id: 'dept-1' }))
    };
    const res = createRes();
    const next = jest.fn();

    await TrainerModuleController.listSessions(req, res, next);

    expect(req.applyTenantFilter).toHaveBeenCalled();
    expect(TrainingSession.find).toHaveBeenCalledWith({
      tenant_id: 'tenant-1',
      department_id: 'dept-1'
    });
    expect(sortMock).toHaveBeenCalledWith({ start_time: 1 });
  });

  it('updates assignments with tenant-aware filters', async () => {
    TrainingAssignment.findOneAndUpdate.mockResolvedValue({ _id: 'assign-1' });

    const req = {
      params: { id: 'assign-1' },
      body: { status: 'active' },
      user: { tenant_id: 'tenant-1' },
      scopeContext: { tenant_id: 'tenant-1', department_id: 'dept-1' },
      applyTenantFilter: jest.fn((filter) => ({ ...filter, tenant_id: 'tenant-1' }))
    };
    const res = createRes();
    const next = jest.fn();

    await TrainerModuleController.updateAssignment(req, res, next);

    expect(req.applyTenantFilter).toHaveBeenCalledWith(
      { _id: 'assign-1' },
      { includeDepartment: true, force: false }
    );
    expect(TrainingAssignment.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'assign-1', tenant_id: 'tenant-1' },
      expect.objectContaining({ status: 'active' }),
      { new: true }
    );
  });

  it('records assessments with enforced tenant context', async () => {
    TrainingAssessment.findOneAndUpdate.mockResolvedValue({ _id: 'assessment-1' });

    const req = {
      body: {
        session_id: 'session-1',
        user_id: 'user-123',
        score: 85,
        status: 'PASS'
      },
      user: { tenant_id: 'tenant-1', department_id: 'dept-1' },
      scopeContext: { tenant_id: 'tenant-1', department_id: 'dept-1' }
    };
    const res = createRes();
    const next = jest.fn();

    await TrainerModuleController.recordAssessment(req, res, next);

    expect(TrainingAssessment.findOneAndUpdate).toHaveBeenCalledWith(
      {
        tenant_id: 'tenant-1',
        department_id: 'dept-1',
        session_id: 'session-1',
        user_id: 'user-123'
      },
      expect.objectContaining({
        tenant_id: 'tenant-1',
        department_id: 'dept-1',
        score: 85
      }),
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  });
});


