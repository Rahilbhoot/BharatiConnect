import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';
import { ProofDecisionService } from '../src/services/proofDecisionService';
import { ProofReviewService } from '../src/services/proofReviewService';
import { PointsService } from '../src/services/pointsService';
import { User } from '../src/models/User';
import { Book } from '../src/models/Book';
import { ReadingLog } from '../src/models/ReadingLog';
import { ProofOutcome, Role } from '@shared/types';

describe('Proof Pipeline: Decision & Review Services', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('evaluates all PRD 7.5 decision rules in exact precedence order', () => {
    const baseVerdict = {
      isBookPage: true,
      isScreenPhoto: false,
      textLegible: true,
      printedPageNumber: 42,
      language: 'mr',
      titleVisible: 'Book Title',
      confidence: 0.95,
      reason: 'Clear book page'
    };

    // 1. Duplicate photo
    const r1 = ProofDecisionService.decide({
      verdict: baseVerdict,
      claimedPage: 42,
      isDuplicatePhoto: true
    });
    expect(r1.outcome).toBe(ProofOutcome.Retake);

    // 2. Not a book page
    const r2 = ProofDecisionService.decide({
      verdict: { ...baseVerdict, isBookPage: false },
      claimedPage: 42
    });
    expect(r2.outcome).toBe(ProofOutcome.Retake);

    // 3. Not a book page, but after 3 retakes -> forwards to needs_review
    const r3 = ProofDecisionService.decide({
      verdict: { ...baseVerdict, isBookPage: false },
      claimedPage: 42,
      retakeCountToday: 3
    });
    expect(r3.outcome).toBe(ProofOutcome.NeedsReview);

    // 4. Text not legible
    const r4 = ProofDecisionService.decide({
      verdict: { ...baseVerdict, textLegible: false },
      claimedPage: 42
    });
    expect(r4.outcome).toBe(ProofOutcome.Retake);

    // 5. Photo of a screen
    const r5 = ProofDecisionService.decide({
      verdict: { ...baseVerdict, isScreenPhoto: true },
      claimedPage: 42
    });
    expect(r5.outcome).toBe(ProofOutcome.NeedsReview);

    // 6. Low confidence (< 0.7)
    const r6 = ProofDecisionService.decide({
      verdict: { ...baseVerdict, confidence: 0.65 },
      claimedPage: 42
    });
    expect(r6.outcome).toBe(ProofOutcome.NeedsReview);

    // 7. Printed page differs from claimed page by > 2
    const r7 = ProofDecisionService.decide({
      verdict: { ...baseVerdict, printedPageNumber: 50 },
      claimedPage: 42
    });
    expect(r7.outcome).toBe(ProofOutcome.NeedsReview);

    // 8. Printed page <= last proven page
    const r8 = ProofDecisionService.decide({
      verdict: { ...baseVerdict, printedPageNumber: 42 },
      claimedPage: 42,
      lastProvenPage: 45
    });
    expect(r8.outcome).toBe(ProofOutcome.NeedsReview);

    // 9. All conditions met -> Accepted
    const r9 = ProofDecisionService.decide({
      verdict: baseVerdict,
      claimedPage: 42,
      lastProvenPage: 30
    });
    expect(r9.outcome).toBe(ProofOutcome.Accepted);
  });

  it('submits review rejection with points reversal and streak rollback (PRD 6.9, 7.6)', async () => {
    const admin = await User.create({
      name: 'Admin Reviewer',
      email: 'revadmin@test.org',
      passwordHash: 'hash',
      role: Role.Admin
    });

    const staff = await User.create({
      name: 'Staff Reviewee',
      email: 'reviewee@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      currentStreak: 3,
      longestStreak: 3,
      lastLogDate: '2026-10-03'
    });

    const book = await Book.create({
      title: 'Review Book',
      author: 'Author',
      totalPages: 100,
      language: 'mr'
    });

    // Reading log with needs_review
    const log = await ReadingLog.create({
      userId: staff._id,
      date: '2026-10-03',
      bookId: book._id,
      startPage: 20,
      currentPage: 30,
      pagesRead: 10,
      provisional: true,
      proof: {
        status: ProofOutcome.NeedsReview,
        attempts: 1,
        spotCheck: false
      }
    });

    // Awarded 10 points provisionally
    await PointsService.awardPoints(staff._id, 10, 'reading_day', log.id, 'ReadingLog');
    expect((await User.findById(staff._id))?.points).toBe(10);

    // Admin rejects the proof
    await ProofReviewService.submitDecision(log._id, 'rejected', admin.id, 'Blurry text on review');

    const updatedLog = await ReadingLog.findById(log._id);
    expect(updatedLog?.proof?.adminDecision).toBe('rejected');
    expect(updatedLog?.proof?.status).toBe(ProofOutcome.Retake);

    // Points should be reversed to 0
    const updatedStaff = await User.findById(staff._id);
    expect(updatedStaff?.points).toBe(0);
  });
});
