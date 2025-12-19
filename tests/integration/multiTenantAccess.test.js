const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { TrainingSession } = require('../../models/trainingSession');

jest.mock('../../middlewares/AuthMiddleware', () => {
  const decodeUser = (headerValue) => {
    const json = Buffer.from(headerValue, 'base64').toString('utf8');
    return JSON.parse(json);
  };

  const passthrough = () => (req, res, next) => next();

  return {
    authenticate: (req, res, next) => {
      const header = req.headers['x-test-user'];
      if (!header) {
        return res.status(401).json({ success: false, message: 'Test user header missing' });
      }
      req.user = decodeUser(header);
      next();
    },
    authorize: passthrough,
    authorizeAny: passthrough,
    authorizeAll: passthrough,
    authorizeRole: passthrough,
    authorizeScope: passthrough,
    optionalAuth: passthrough
  };
});

const trainerRoutes = require('../../routes/trainerModuleRoutes');

const app = express();
app.use(express.json());
app.use('/trainer-module', trainerRoutes);

const encodeUser = ({ tenantId, departmentId, roleCode }) =>
  Buffer.from(JSON.stringify({
    _id: new mongoose.Types.ObjectId().toString(),
    tenant_id: tenantId,
    department_id: departmentId,
    role: {
      role_code: roleCode,
      scope_rules: { tenant_scope: 'tenant', department_scope: 'own' }
    }
  })).toString('base64');

describe('Multi-tenant integration', () => {
  const tenantA = new mongoose.Types.ObjectId().toString();
  const tenantB = new mongoose.Types.ObjectId().toString();
  const deptA = new mongoose.Types.ObjectId().toString();
  const deptB = new mongoose.Types.ObjectId().toString();
  const courseA = new mongoose.Types.ObjectId();
  const courseB = new mongoose.Types.ObjectId();

  let sessionA;
  let sessionB;

  beforeEach(async () => {
    const now = new Date();
    [sessionA, sessionB] = await TrainingSession.create([
      {
        tenant_id: tenantA,
        department_id: deptA,
        course_id: courseA,
        session_name: 'Tenant A Session',
        start_time: now,
        end_time: new Date(now.getTime() + 60 * 60 * 1000),
        max_participants: 20,
        location: 'Room A',
        status_code: 'SCHEDULED'
      },
      {
        tenant_id: tenantB,
        department_id: deptB,
        course_id: courseB,
        session_name: 'Tenant B Session',
        start_time: now,
        end_time: new Date(now.getTime() + 60 * 60 * 1000),
        max_participants: 25,
        location: 'Room B',
        status_code: 'SCHEDULED'
      }
    ]);
  });

  it('returns only records for the caller tenant', async () => {
    const authHeader = encodeUser({ tenantId: tenantA, departmentId: deptA, roleCode: 'trainer' });
    const res = await request(app)
      .get('/trainer-module/sessions')
      .set('x-test-user', authHeader)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]._id.toString()).toEqual(sessionA._id.toString());
  });

  it('prevents cross-tenant updates with enforced filters', async () => {
    const authHeader = encodeUser({ tenantId: tenantB, departmentId: deptB, roleCode: 'trainer' });
    await request(app)
      .put(`/trainer-module/sessions/${sessionA._id}`)
      .set('x-test-user', authHeader)
      .send({ session_name: 'Hacked Name' })
      .expect(404);
  });

  it('allows legitimate updates within the same tenant', async () => {
    const authHeader = encodeUser({ tenantId: tenantA, departmentId: deptA, roleCode: 'trainer' });
    const res = await request(app)
      .put(`/trainer-module/sessions/${sessionA._id}`)
      .set('x-test-user', authHeader)
      .send({ session_name: 'Updated Name' })
      .expect(200);

    expect(res.body.data.session_name).toBe('Updated Name');
  });
});


