import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';
import { createApp } from '../src/app';
import { User } from '../src/models/User';
import { Book } from '../src/models/Book';
import { Post } from '../src/models/Post';
import { Challenge } from '../src/models/Challenge';
import { Settings } from '../src/models/Settings';
import { Role, PostType, ChallengeType } from '@shared/types';
import { env } from '../src/config/env';

const app = createApp();

function generateToken(user: any): string {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );
}

describe('API Routes Integration Tests (Part C)', () => {
  let staffUser: any;
  let adminUser: any;
  let staffToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await Settings.create({ minimumPages: 1 });

    staffUser = await User.create({
      name: 'Staff Member',
      email: 'staff@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      active: true
    });
    staffToken = generateToken(staffUser);

    adminUser = await User.create({
      name: 'Admin Member',
      email: 'admin@test.org',
      passwordHash: 'hash',
      role: Role.Admin,
      active: true
    });
    adminToken = generateToken(adminUser);
  });

  it('serves health endpoint', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('allows staff to search books and manage personal shelf', async () => {
    const book = await Book.create({
      title: 'Wings of Fire',
      author: 'A. P. J. Abdul Kalam',
      totalPages: 180,
      language: 'en'
    });

    // 1. Search books
    const searchRes = await request(app)
      .get('/api/books/search?q=Wings')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(searchRes.status).toBe(200);

    // 2. Add to shelf
    const addRes = await request(app)
      .post('/api/me/shelf')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ bookId: book._id.toString(), status: 'reading' });
    expect(addRes.status).toBe(201);
    expect(addRes.body.status).toBe('reading');

    // 3. View shelf
    const shelfRes = await request(app)
      .get('/api/me/shelf')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(shelfRes.status).toBe(200);
    expect(shelfRes.body).toHaveLength(1);
    expect(shelfRes.body[0].bookId.title).toBe('Wings of Fire');
  });

  it('allows staff to view notices and mark them as read', async () => {
    const notice = await Post.create({
      type: PostType.Notice,
      title: { en: 'Library Reopening', mr: 'वाचनालय पुन्हा सुरू' },
      body: { en: 'The library is open from 9 AM.', mr: 'सकाळी ९ वाजल्यापासून वाचनालय सुरू राहील.' },
      pinned: false,
      publishedAt: new Date(),
      createdBy: adminUser._id
    });

    // 1. List notices (isRead false initially)
    const listRes1 = await request(app)
      .get('/api/notices')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(listRes1.status).toBe(200);
    expect(listRes1.body.notices).toHaveLength(1);
    expect(listRes1.body.notices[0].isRead).toBe(false);

    // 2. Mark as read
    const readRes = await request(app)
      .post(`/api/notices/${notice._id}/read`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(readRes.status).toBe(200);

    // 3. List notices again (isRead true)
    const listRes2 = await request(app)
      .get('/api/notices')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(listRes2.body.notices[0].isRead).toBe(true);
  });

  it('allows staff to browse and join active challenges', async () => {
    const challenge = await Challenge.create({
      title: { en: 'Daily Reader', mr: 'दैनिक वाचक' },
      description: { en: 'Read 7 days in a row', mr: 'सलग ७ दिवस वाचन करा' },
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000 * 7),
      type: ChallengeType.IndividualDays,
      target: 7,
      rewardPoints: 50,
      active: true,
      createdBy: adminUser._id
    });

    // 1. Browse challenges
    const listRes = await request(app)
      .get('/api/challenges')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);

    // 2. Join challenge
    const joinRes = await request(app)
      .post(`/api/challenges/${challenge._id}/join`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(joinRes.status).toBe(201);
    expect(joinRes.body.entry.progress).toBe(0);
  });

  it('enforces RBAC on admin endpoints (rejects staff, allows admin)', async () => {
    // Staff attempting admin dashboard
    const forbiddenRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(forbiddenRes.status).toBe(403);

    // Admin accessing dashboard
    const adminRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.staffStats).toBeDefined();
  });

  it('allows admin to manually backfill a missed reading day with reason (Admin-10)', async () => {
    const book = await Book.create({
      title: 'Backfilled Book',
      author: 'Author',
      totalPages: 100,
      language: 'mr'
    });

    const backfillRes = await request(app)
      .post('/api/admin/reading/add-day')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: staffUser._id.toString(),
        date: '2026-10-10',
        bookId: book._id.toString(),
        pagesRead: 15,
        reason: 'Staff was on college field assignment with offline reading'
      });

    expect(backfillRes.status).toBe(201);
    expect(backfillRes.body.log.pagesRead).toBe(15);
    expect(backfillRes.body.log.note).toContain('Staff was on college field assignment');
  });
});
