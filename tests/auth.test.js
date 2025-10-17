const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

//   connect to test database
let mongoServer;
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

//  clean DB before each test
beforeEach(async () => {
  await User.deleteMany();
});

// disconnect after tests
afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

//  -------------- TEST CASES -------------- 
describe('Auth API', () => {

  test('✅ should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Arwa',
        email: 'arwa@test.com',
        password: '123456'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe('arwa@test.com');
    expect(res.body).toHaveProperty('token');
  });

  test('🚫 should not allow duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Arwa',
      email: 'arwa@test.com',
      password: '123456'
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Arwa',
      email: 'arwa@test.com',
      password: '123456'
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already/i);
  });

  test('✅ should login with correct credentials', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Arwa',
      email: 'arwa@test.com',
      password: '123456'
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'arwa@test.com',
      password: '123456'
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('🚫 should not login with wrong password', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Arwa',
      email: 'arwa@test.com',
      password: '123456'
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'arwa@test.com',
      password: 'wrongpass'
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/invalid/i);
  });
});

