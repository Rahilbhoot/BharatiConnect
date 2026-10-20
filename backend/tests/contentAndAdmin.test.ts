import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';
import { PostService } from '../src/services/postService';
import { VideoService } from '../src/services/videoService';
import { BookSuggestionService } from '../src/services/bookSuggestionService';
import { DashboardService } from '../src/services/dashboardService';
import { ReportsService } from '../src/services/reportsService';
import { HolidayService } from '../src/services/holidayService';
import { User } from '../src/models/User';
import { Department } from '../src/models/Department';
import { Book } from '../src/models/Book';
import { ReadingLog } from '../src/models/ReadingLog';
import { Role, PostType, VideoCategory, Language, SuggestionStatus, HolidayType } from '@shared/types';
import { getTodayDateString } from '../src/utils/dateUtils';

describe('Content and Admin Services', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('manages notices, read receipts, and isRead flag per user (Notice-01 to 04)', async () => {
    const admin = await User.create({
      name: 'Admin Poster',
      email: 'poster@test.org',
      passwordHash: 'hash',
      role: Role.Admin
    });

    const staff = await User.create({
      name: 'Staff Reader',
      email: 'sreader@test.org',
      passwordHash: 'hash',
      role: Role.Staff
    });

    // 1. Create notice
    const notice = await PostService.createNotice(
      {
        title: { en: 'Annual Meet', mr: 'वार्षिक बैठक' },
        body: { en: 'Meeting at 10 AM', mr: 'सकाळी १० वाजता बैठक' },
        pinned: true
      },
      admin.id
    );

    expect(notice.pinned).toBe(true);

    // 2. Staff lists notices -> isRead should be false
    const initialList = await PostService.listNotices(staff._id);
    expect(initialList.notices[0].isRead).toBe(false);

    // 3. Staff marks read
    await PostService.markRead(notice._id, staff._id);

    // 4. Staff lists notices again -> isRead should be true
    const updatedList = await PostService.listNotices(staff._id);
    expect(updatedList.notices[0].isRead).toBe(true);

    // 5. Admin checks read receipts
    const receipts = await PostService.getReadReceipts(notice._id);
    expect(receipts.readCount).toBe(1);
    expect(receipts.readPercentage).toBe(100);
  });

  it('adds video, marks as watched, and awards 5 points (Video-01 to 04)', async () => {
    const admin = await User.create({
      name: 'Admin Video',
      email: 'vadmin@test.org',
      passwordHash: 'hash',
      role: Role.Admin
    });

    const staff = await User.create({
      name: 'Video Watcher',
      email: 'vwatcher@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      points: 0
    });

    const video = await VideoService.addVideo(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      VideoCategory.Writing,
      Language.Marathi,
      { en: 'Intro to AI writing', mr: 'एआय लेखन परिचय' },
      admin.id
    );

    expect(video.youtubeId).toBe('dQw4w9WgXcQ');

    // Staff marks watched
    await VideoService.markWatched(video._id, staff._id);

    const updatedStaff = await User.findById(staff._id);
    expect(updatedStaff?.points).toBe(5);

    // Second watch does not award points again
    await VideoService.markWatched(video._id, staff._id);
    const updatedStaff2 = await User.findById(staff._id);
    expect(updatedStaff2?.points).toBe(5);
  });

  it('submits book suggestion and creates Book on admin approval (Book-04)', async () => {
    const admin = await User.create({
      name: 'Admin Approver',
      email: 'appadmin@test.org',
      passwordHash: 'hash',
      role: Role.Admin
    });

    const staff = await User.create({
      name: 'Suggesting Staff',
      email: 'sugstaff@test.org',
      passwordHash: 'hash',
      role: Role.Staff
    });

    const suggestion = await BookSuggestionService.submitSuggestion(
      staff._id,
      'Mrityunjay',
      'Shivaji Sawant',
      'Great classic novel',
      Language.Marathi
    );

    expect(suggestion.status).toBe(SuggestionStatus.Pending);

    // Admin approves and adds as staffPick
    const result = await BookSuggestionService.reviewSuggestion(
      suggestion._id,
      SuggestionStatus.Approved,
      admin.id,
      true
    );

    expect(result.suggestion.status).toBe(SuggestionStatus.Approved);
    expect(result.createdBook).toBeDefined();
    expect(result.createdBook?.title).toBe('Mrityunjay');
    expect(result.createdBook?.staffPick).toBe(true);
  });

  it('generates dashboard metrics, reading reports, and CSV export (Admin-01, Admin-08)', async () => {
    const dept = await Department.create({
      name: { en: 'Field Staff', mr: 'फील्ड कर्मचारी' },
      code: 'FIELD'
    });

    const staff = await User.create({
      name: 'Active Staffer',
      email: 'active@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      departmentId: dept._id,
      currentStreak: 5,
      points: 50
    });

    const book = await Book.create({
      title: 'Report Book',
      author: 'Author',
      totalPages: 100,
      language: 'mr'
    });

    const today = getTodayDateString();
    await ReadingLog.create({
      userId: staff._id,
      date: today,
      bookId: book._id,
      startPage: 0,
      currentPage: 20,
      pagesRead: 20
    });

    // 1. Dashboard metrics
    const dash = await DashboardService.getDashboard();
    expect(dash.staffStats.totalStaff).toBe(1);
    expect(dash.staffStats.loggedTodayCount).toBe(1);
    expect(dash.streakDistribution.buckets.oneToSix).toBe(1);

    // 2. Reading report
    const report = await ReportsService.getReadingReport(today, today);
    expect(report.totalStaff).toBe(1);
    expect(report.report[0].pagesRead).toBe(20);

    // 3. Export CSV
    const csv = await ReportsService.exportReadingReport(today, today);
    expect(csv).toContain('Name,Email,Department');
    expect(csv).toContain('"Active Staffer"');
    expect(csv).toContain('20');
  });

  it('manages holidays, leaves, and excused streak days (Admin-07)', async () => {
    const admin = await User.create({
      name: 'Admin Holiday',
      email: 'hadmin@test.org',
      passwordHash: 'hash',
      role: Role.Admin
    });

    const staff = await User.create({
      name: 'Holiday Staff',
      email: 'hstaff@test.org',
      passwordHash: 'hash',
      role: Role.Staff
    });

    // Org-wide holiday
    await HolidayService.addHoliday(
      '2026-11-01',
      { en: 'Diwali', mr: 'दिवाळी' },
      HolidayType.Holiday,
      null,
      admin.id
    );

    // Staff-specific leave
    await HolidayService.addHoliday(
      '2026-11-05',
      { en: 'Personal Leave', mr: 'वैयक्तिक सुट्टी' },
      HolidayType.Leave,
      staff.id,
      admin.id
    );

    // Org-wide holiday is excused for staff
    expect(await HolidayService.isExcusedDay(staff._id, '2026-11-01')).toBe(true);

    // Staff leave is excused for staff
    expect(await HolidayService.isExcusedDay(staff._id, '2026-11-05')).toBe(true);

    // Random non-holiday date is not excused
    expect(await HolidayService.isExcusedDay(staff._id, '2026-11-10')).toBe(false);
  });
});
