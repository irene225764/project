import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../src/app.js';
import Comment from '../src/models/Comment.js';
import Issue from '../src/models/Issue.js';
import User from '../src/models/User.js';

const password = 'valid-campus-password';
const payload = {
  title: 'Broken hallway light',
  description: 'The light flickers continuously near the north entrance.',
  category: 'Electrical',
  location: 'North Hall, floor 2',
  priority: 'Medium',
};

describe('CampusFix API', () => {
  let mongo;
  let reporter;
  let otherReporter;
  let admin;
  let reporterToken;
  let otherToken;
  let adminToken;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-with-enough-entropy-for-jwt-signing';
    process.env.CLIENT_ORIGIN = 'http://localhost:5173';
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await Promise.all([User.deleteMany({}), Issue.deleteMany({}), Comment.deleteMany({})]);
    const hashedPassword = await bcrypt.hash(password, 4);
    [reporter, otherReporter, admin] = await User.create([
      { name: 'Casey Reporter', email: 'casey@example.edu', password: hashedPassword },
      { name: 'Taylor Reporter', email: 'taylor@example.edu', password: hashedPassword },
      { name: 'Alex Admin', email: 'admin@example.edu', password: hashedPassword, role: 'admin' },
    ]);
    [reporterToken, otherToken, adminToken] = [reporter, otherReporter, admin].map((user) => jwt.sign(
      { sub: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' },
    ));
  });

  it('registers users with a hashed password and rejects invalid or duplicate accounts', async () => {
    const created = await request(app).post('/api/auth/register').send({
      name: 'New Reporter', email: 'new@example.edu', password,
    });
    expect(created.status).toBe(201);
    expect(created.body.data.user.role).toBe('user');
    expect('password' in created.body.data.user).toBe(false);
    const stored = await User.findOne({ email: 'new@example.edu' }).select('+password');
    expect(stored.password).not.toBe(password);
    expect(await login('new@example.edu')).toBeTruthy();

    const duplicate = await request(app).post('/api/auth/register').send({
      name: 'New Reporter', email: 'new@example.edu', password,
    });
    expect(duplicate.status).toBe(409);
    const invalid = await request(app).post('/api/auth/register').send({
      name: 'X', email: 'bad', password: 'short', role: 'admin',
    });
    expect(invalid.status).toBe(400);
  });

  it('requires a valid token and prevents non-admin management actions', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/issues')).status).toBe(401);
    expect((await request(app).get('/api/issues').set('Authorization', 'Bearer invalid')).status).toBe(401);
    const createdIssue = await createIssue(reporterToken);
    const forbidden = await request(app).patch(`/api/issues/${createdIssue._id}/status`)
      .set(auth(reporterToken)).send({ status: 'In Progress' });
    expect(forbidden.status).toBe(403);
  });

  it('validates issue input and enforces ownership for reads, edits, and deletes', async () => {
    const invalid = await request(app).post('/api/issues').set(auth(reporterToken)).send({
      ...payload, title: 'bad', category: { $ne: 'Electrical' },
    });
    expect(invalid.status).toBe(400);

    const issue = await createIssue(reporterToken);
    expect(issue.status).toBe('Open');
    const hidden = await request(app).get(`/api/issues/${issue._id}`).set(auth(otherToken));
    expect(hidden.status).toBe(404);
    const deniedEdit = await request(app).put(`/api/issues/${issue._id}`).set(auth(otherToken)).send({ title: 'Changed title' });
    expect(deniedEdit.status).toBe(404);
    const deniedDelete = await request(app).delete(`/api/issues/${issue._id}`).set(auth(otherToken));
    expect(deniedDelete.status).toBe(404);

    const edited = await request(app).put(`/api/issues/${issue._id}`).set(auth(reporterToken)).send({ title: 'Changed hallway light' });
    expect(edited.status).toBe(200);
    expect(edited.body.data.title).toBe('Changed hallway light');
  });

  it('lets admins filter, search, paginate, assign priority, and advance status', async () => {
    await createIssue(reporterToken);
    await createIssue(reporterToken, { ...payload, title: 'Leaking sink in library', category: 'Plumbing', priority: 'High' });
    await createIssue(otherToken, { ...payload, title: 'Wi-Fi access point offline', category: 'Network' });

    const ownReports = await request(app).get('/api/issues').set(auth(reporterToken));
    expect(ownReports.body.data.length).toBe(2);
    const search = await request(app).get('/api/issues?search=Wi-Fi').set(auth(adminToken));
    expect(search.status).toBe(200);
    expect(search.body.data.length).toBe(1);
    expect(search.body.data[0].title).toBe('Wi-Fi access point offline');
    const page = await request(app).get('/api/issues?limit=1&page=2').set(auth(adminToken));
    expect(page.status).toBe(200);
    expect(page.body.data.length).toBe(1);
    expect(page.body.pagination.page).toBe(2);
    const overLimit = await request(app).get('/api/issues?limit=51').set(auth(adminToken));
    expect(overLimit.status).toBe(400);

    const issue = await Issue.findOne({ title: payload.title });
    const priority = await request(app).patch(`/api/issues/${issue.id}/priority`).set(auth(adminToken)).send({ priority: 'High' });
    expect(priority.status).toBe(200);
    expect(priority.body.data.priority).toBe('High');
    const inProgress = await request(app).patch(`/api/issues/${issue.id}/status`).set(auth(adminToken)).send({ status: 'In Progress' });
    expect(inProgress.status).toBe(200);
    const resolved = await request(app).patch(`/api/issues/${issue.id}/status`).set(auth(adminToken)).send({ status: 'Resolved' });
    expect(resolved.status).toBe(200);
    const reopened = await request(app).patch(`/api/issues/${issue.id}/status`).set(auth(adminToken)).send({ status: 'Open' });
    expect(reopened.status).toBe(409);
  });

  it('creates referenced comments and keeps issue conversations scoped', async () => {
    const issue = await createIssue(reporterToken);
    const comment = await request(app).post(`/api/issues/${issue._id}/comments`).set(auth(reporterToken)).send({ text: 'I noticed this today.' });
    expect(comment.status).toBe(201);
    expect(comment.body.data.issue).toBe(issue._id);
    expect(await Comment.countDocuments({ issue: issue._id })).toBe(1);
    const listed = await request(app).get(`/api/issues/${issue._id}/comments`).set(auth(reporterToken));
    expect(listed.body.data.length).toBe(1);
    const hidden = await request(app).get(`/api/issues/${issue._id}/comments`).set(auth(otherToken));
    expect(hidden.status).toBe(404);
  });
});

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

async function login(email) {
  const result = await request(app).post('/api/auth/login').send({ email, password });
  expect(result.status).toBe(200);
  return result.body.data.token;
}

async function createIssue(token, issuePayload = payload) {
  const result = await request(app).post('/api/issues').set(auth(token)).send(issuePayload);
  expect(result.status).toBe(201);
  return result.body.data;
}