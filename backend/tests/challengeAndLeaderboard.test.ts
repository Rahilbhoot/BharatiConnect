import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';
import { ChallengeService } from '../src/services/challengeService';
import { LeaderboardService } from '../src/services/leaderboardService';
import { PointsService } from '../src/services/pointsService';
import { User } from '../src/models/User';
import { Department } from '../src/models/Department';
import { Challenge } from '../src/models/Challenge';
import { ChallengeEntry } from '../src/models/ChallengeEntry';
import { ChallengeType, Role } from '@shared/types';
import { subDays, addDays } from 'date-fns';

describe('ChallengeService and LeaderboardService', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('creates, joins, tracks progress, and completes a challenge with reward points (Game-05)', async () => {
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@test.org',
      passwordHash: 'hash',
      role: Role.Admin
    });

    const staff = await User.create({
      name: 'Challenger',
      email: 'challenger@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      points: 0
    });

    const challenge = await ChallengeService.createChallenge(
      {
        title: { en: 'Read 50 Pages', mr: '५० पाने वाचा' },
        description: { en: 'Read 50 pages this week', mr: 'या आठवड्यात ५० पाने वाचा' },
        startDate: subDays(new Date(), 1),
        endDate: addDays(new Date(), 6),
        type: ChallengeType.IndividualPages,
        target: 50,
        rewardPoints: 150
      },
      admin.id
    );

    expect(challenge.target).toBe(50);

    // Staff joins
    const entry = await ChallengeService.joinChallenge(challenge._id, staff._id);
    expect(entry.progress).toBe(0);

    // Staff logs reading 30 pages
    await ChallengeService.updateProgress(staff._id, 30);
    const updatedEntry1 = await ChallengeEntry.findOne({ challengeId: challenge._id, userId: staff._id });
    expect(updatedEntry1?.progress).toBe(30);
    expect(updatedEntry1?.completedAt).toBeUndefined();

    // Staff logs another 25 pages -> 55 >= 50 target, completed!
    await ChallengeService.updateProgress(staff._id, 25);
    const updatedEntry2 = await ChallengeEntry.findOne({ challengeId: challenge._id, userId: staff._id });
    expect(updatedEntry2?.progress).toBe(55);
    expect(updatedEntry2?.completedAt).toBeDefined();

    const updatedUser = await User.findById(staff._id);
    expect(updatedUser?.points).toBe(150);
    expect(updatedUser?.level).toBe('page_turner');
  });

  it('aggregates leaderboard per department and calculates individual rank (Game-04)', async () => {
    const dept = await Department.create({
      name: { en: 'Education', mr: 'शिक्षण' },
      code: 'EDU'
    });

    const staff1 = await User.create({
      name: 'Rank One',
      email: 'one@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      departmentId: dept._id
    });

    const staff2 = await User.create({
      name: 'Rank Two',
      email: 'two@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      departmentId: dept._id
    });

    // Award points this week
    await PointsService.awardPoints(staff1._id, 100, 'reading_day');
    await PointsService.awardPoints(staff2._id, 50, 'reading_day');

    // 1. Department leaderboard
    const deptLeaderboard = await LeaderboardService.getDepartmentLeaderboard('weekly');
    expect(deptLeaderboard).toHaveLength(1);
    expect(deptLeaderboard[0].totalPoints).toBe(150);

    // 2. Individual leaderboard
    const indivLeaderboard = await LeaderboardService.getIndividualLeaderboard('weekly', staff2.id);
    expect(indivLeaderboard.top10).toHaveLength(2);
    expect(indivLeaderboard.top10[0].name).toBe('Rank One');
    expect(indivLeaderboard.top10[0].rank).toBe(1);
    expect(indivLeaderboard.userRank.rank).toBe(2);
    expect(indivLeaderboard.userRank.name).toBe('Rank Two');
  });
});
