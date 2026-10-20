import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';
import { StaffService } from '../src/services/staffService';
import { User } from '../src/models/User';
import { RefreshToken } from '../src/models/RefreshToken';
import { Role } from '@shared/types';
import mongoose from 'mongoose';

describe('StaffService', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('revokes refresh tokens when a staff member is deactivated (Auth-10)', async () => {
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.org',
      passwordHash: 'hash',
      role: Role.Admin
    });

    const staff = await User.create({
      name: 'Staff User',
      email: 'staff@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      active: true
    });

    // Create 2 active refresh tokens for this staff member
    await RefreshToken.create([
      { userId: staff.id, token: 'token-1', family: 'family-1', expiresAt: new Date(Date.now() + 86400000), revoked: false },
      { userId: staff.id, token: 'token-2', family: 'family-1', expiresAt: new Date(Date.now() + 86400000), revoked: false }
    ]);

    await StaffService.deactivateStaff(staff.id, admin.id);

    const updatedStaff = await User.findById(staff.id);
    expect(updatedStaff?.active).toBe(false);

    const activeTokens = await RefreshToken.find({ userId: staff.id, revoked: false });
    expect(activeTokens).toHaveLength(0);

    const revokedTokens = await RefreshToken.find({ userId: staff.id, revoked: true });
    expect(revokedTokens).toHaveLength(2);
  });
});
