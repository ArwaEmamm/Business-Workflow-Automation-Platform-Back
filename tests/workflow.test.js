const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Workflow = require('../src/models/Workflow');

let token;
let userId;

let mongoServer;
beforeAll(async () => {
  // start in-memory mongo
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // register a user and capture token
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Arwa', email: 'arwa@test.com', password: '123456' });

  token = res.body.token;
  // authController returns user.id (not _id)
  userId = res.body.user.id;
});

//  تنظيف البيانات قبل كل اختبار
beforeEach(async () => {
  await Workflow.deleteMany();
});

//  قطع الاتصال بعد نهاية جميع الاختبارات
afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

//  مجموعة اختبارات API الخاصة بالـ Workflow
describe('Workflow API', () => {

  // . إنشاء Workflow جديد
  test('should create a new workflow', async () => {
    const res = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Holiday Request',
        description: 'Request for employee holiday',
        steps: [{ title: 'Approval', order: 1, assignedRole: 'manager' }]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.workflow.name).toBe('Holiday Request');
  });

  // . جلب كل الـ Workflows
  test('should fetch all workflows', async () => {
    await Workflow.create({
      name: 'Sample Workflow',
      description: 'For testing',
      createdBy: userId,
      steps: [{ title: 'Step 1', order: 1, assignedRole: 'employee' }]
    });

    const res = await request(app)
      .get('/api/workflows')
      .set('Authorization', `Bearer ${token}`);

  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body.workflows)).toBe(true);
  });

  // . جلب Workflow محدد بالـ ID
  test('should fetch a single workflow by ID', async () => {
    // نعمل واحد جديد عشان نستخدم الـ id بتاعه
    const workflow = await Workflow.create({
      name: 'Overtime Request',
      description: 'Request for overtime approval',
      createdBy: userId,
      steps: [{ title: 'Manager Approval', order: 1, assignedRole: 'manager' }]
    });

    // نطلبه باستخدام الـ ID
    const res = await request(app)
      .get(`/api/workflows/${workflow._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.workflow.name).toBe('Overtime Request');
    expect(res.body.workflow._id).toBe(workflow._id.toString());
  });
});
