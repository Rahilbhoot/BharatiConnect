import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';
import { User } from '../src/models/User';
import { ReadingLog } from '../src/models/ReadingLog';
import { Book } from '../src/models/Book';
import { Post } from '../src/models/Post';
import { Challenge } from '../src/models/Challenge';
import { ChallengeEntry } from '../src/models/ChallengeEntry';
import { Notification } from '../src/models/Notification';
import { PointsLedger } from '../src/models/PointsLedger';
import { DailyReminderJob } from '../src/jobs/dailyReminder';
import { EveningNudgeJob } from '../src/jobs/eveningNudge';
import { ChallengeNotificationsJob } from '../src/jobs/challengeNotifications';
import { ReaderOfMonthJob } from '../src/jobs/readerOfMonth';
import { ExpireNoticesJob } from '../src/jobs/expireNotices';
import { CleanupExpiredPhotosJob } from '../src/jobs/cleanupExpiredPhotos';
import { Role, Language, PostType, ChallengeType } from '@shared/types';
import { getTodayDateString, TIMEZONE } from '../src/utils/dateUtils';
import { format, toZonedTime } from 'date-fns-tz';
import { addDays, subDays, subMonths } from 'date-fns';

describe('Part D: Background Cron Jobs Suite', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('D2: DailyReminderJob reminds unlogged staff whose reminderTime matches current IST time', async () => {
    const currentTimeIST = format(toZonedTime(new Date(), TIMEZONE), 'HH:mm');

    const user1 = await User.create({
      name: 'Pooja Patil',
      email: 'pooja@test.com',
      role: Role.Staff,
      language: Language.Marathi,
      reminderTime: currentTimeIST,
      active: true,
      passwordHash: 'hash',
      branches: ['Main']
    });

    const user2 = await User.create({
      name: 'Rohan Sharma',
      email: 'rohan@test.com',
      role: Role.Staff,
      language: Language.English,
      reminderTime: '23:59', // Different time, shouldn't trigger
      active: true,
      passwordHash: 'hash',
      branches: ['Main']
    });

    const count = await DailyReminderJob.runDailyReminders();
    expect(count).toBe(1);

    const notifications = await Notification.find({ userId: user1._id });
    expect(notifications.length).toBe(1);
    expect(notifications[0].title).toContain('वेळ झाली');

    // Run again after user logs reading
    const book = await Book.create({
      title: 'Shyamchi Aai',
      author: 'Sane Guruji',
      totalPages: 100,
      language: Language.Marathi,
      active: true
    });

    await ReadingLog.create({
      userId: user1._id,
      bookId: book._id,
      date: getTodayDateString(),
      startPage: 1,
      currentPage: 10,
      pagesRead: 10
    });

    const countAfterLog = await DailyReminderJob.runDailyReminders();
    expect(countAfterLog).toBe(0);
  });

  it('D3: EveningNudgeJob sends evening nudge to active staff who have not logged today', async () => {
    const user = await User.create({
      name: 'Aarti Kadam',
      email: 'aarti@test.com',
      role: Role.Staff,
      language: Language.English,
      active: true,
      passwordHash: 'hash',
      branches: ['Main']
    });

    const unloggedCount = await EveningNudgeJob.runEveningNudge();
    expect(unloggedCount).toBe(1);

    const notifs = await Notification.find({ userId: user._id });
    expect(notifs.length).toBe(1);
    expect(notifs[0].title).toContain('Evening Nudge');

    // If logged, unloggedCount is 0
    const book = await Book.create({
      title: 'Test Book',
      author: 'Author',
      totalPages: 150,
      language: Language.English,
      active: true
    });
    await ReadingLog.create({
      userId: user._id,
      bookId: book._id,
      date: getTodayDateString(),
      startPage: 1,
      currentPage: 15,
      pagesRead: 15
    });

    const secondRun = await EveningNudgeJob.runEveningNudge();
    expect(secondRun).toBe(0);
  });

  it('D4: ChallengeNotificationsJob sends alerts for challenges starting today & ending tomorrow', async () => {
    const admin = await User.create({
      name: 'Admin Owner',
      email: 'admin@test.com',
      role: Role.Owner,
      active: true,
      passwordHash: 'hash',
      branches: ['Main']
    });

    const staff = await User.create({
      name: 'Kiran Desai',
      email: 'kiran@test.com',
      role: Role.Staff,
      language: Language.English,
      active: true,
      passwordHash: 'hash',
      branches: ['Main']
    });

    const now = new Date();

    // 1. Challenge starting today
    const challengeStarting = await Challenge.create({
      type: ChallengeType.IndividualPages,
      title: { en: 'Weekly Sprint', mr: 'साप्ताहिक वाचन' },
      description: { en: 'Read 50 pages', mr: '५० पाने वाचा' },
      target: 50,
      rewardPoints: 50,
      startDate: now,
      endDate: addDays(now, 7),
      active: true,
      createdBy: admin._id
    });

    // 2. Challenge ending tomorrow with staff enrolled
    const challengeEnding = await Challenge.create({
      type: ChallengeType.IndividualPages,
      title: { en: 'Month Finish', mr: 'महिना उद्दिष्ट' },
      description: { en: 'Read 200 pages', mr: '२०० पाने' },
      target: 200,
      rewardPoints: 200,
      startDate: subDays(now, 20),
      endDate: addDays(now, 1),
      active: true,
      createdBy: admin._id
    });

    await ChallengeEntry.create({
      challengeId: challengeEnding._id,
      userId: staff._id,
      progress: 120
    });

    const notifCount = await ChallengeNotificationsJob.runChallengeNotifications();
    expect(notifCount).toBeGreaterThanOrEqual(2);

    const userNotifs = await Notification.find({ userId: staff._id });
    expect(userNotifs.length).toBeGreaterThanOrEqual(2);
  });

  it('D5: ReaderOfMonthJob posts announcement on the 1st of each month', async () => {
    const admin = await User.create({
      name: 'Admin',
      email: 'superadmin@test.com',
      role: Role.Owner,
      active: true,
      passwordHash: 'hash',
      branches: ['Main']
    });

    const topReader = await User.create({
      name: 'Champion Reader',
      email: 'top@test.com',
      role: Role.Staff,
      active: true,
      passwordHash: 'hash',
      branches: ['Main']
    });

    const book = await Book.create({
      title: 'Epic Book',
      author: 'Famous Author',
      totalPages: 500,
      language: Language.English,
      active: true
    });

    // Create points ledger entry from previous month for topReader
    await PointsLedger.create({
      userId: topReader._id,
      amount: 150,
      reason: 'reading_day',
      createdAt: subMonths(new Date(), 1)
    });

    const post = await ReaderOfMonthJob.runReaderOfMonth();
    expect(post).toBeDefined();
    expect(post?.pinned).toBe(true);
    expect(post?.title.en).toContain('Champion Reader');

    // Running again returns existing post without duplicating
    const duplicateCheck = await ReaderOfMonthJob.runReaderOfMonth();
    expect(duplicateCheck?._id.toString()).toBe(post?._id.toString());
  });

  it('D6: CleanupExpiredPhotosJob triggers review service cleanup', async () => {
    const count = await CleanupExpiredPhotosJob.runCleanup();
    expect(typeof count).toBe('number');
  });

  it('D7: ExpireNoticesJob unpins notices whose expiry date has passed', async () => {
    const admin = await User.create({
      name: 'Notice Admin',
      email: 'noticeadmin@test.com',
      role: Role.Admin,
      active: true,
      passwordHash: 'hash',
      branches: ['Main']
    });

    const expiredNotice = await Post.create({
      type: PostType.Notice,
      title: { en: 'Old Notice', mr: 'जुनी सूचना' },
      body: { en: 'Notice text', mr: 'मजकूर' },
      pinned: true,
      publishedAt: subDays(new Date(), 10),
      expiresAt: subDays(new Date(), 1),
      createdBy: admin._id
    });

    const activeNotice = await Post.create({
      type: PostType.Notice,
      title: { en: 'Active Notice', mr: 'सक्रिय सूचना' },
      body: { en: 'Active notice text', mr: 'मजकूर' },
      pinned: true,
      publishedAt: new Date(),
      expiresAt: addDays(new Date(), 5),
      createdBy: admin._id
    });

    const modified = await ExpireNoticesJob.runExpireNotices();
    expect(modified).toBe(1);

    const refreshedExpired = await Post.findById(expiredNotice._id);
    expect(refreshedExpired?.pinned).toBe(false);

    const refreshedActive = await Post.findById(activeNotice._id);
    expect(refreshedActive?.pinned).toBe(true);
  });
});
