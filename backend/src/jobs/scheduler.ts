import cron from 'node-cron';
import { DailyReminderJob } from './dailyReminder';
import { EveningNudgeJob } from './eveningNudge';
import { ChallengeNotificationsJob } from './challengeNotifications';
import { ReaderOfMonthJob } from './readerOfMonth';
import { CleanupExpiredPhotosJob } from './cleanupExpiredPhotos';
import { ExpireNoticesJob } from './expireNotices';
import { ProofWorker } from './proofWorker';
import { TIMEZONE } from '../utils/dateUtils';
import { logger } from '../config/logger';

export function startScheduler() {
  logger.info('[Scheduler] Initializing automated background cron tasks in timezone:', { timezone: TIMEZONE });

  // 1. Daily Reminders: Check every minute for staff whose reminderTime matches current IST time
  cron.schedule('* * * * *', async () => {
    try {
      await DailyReminderJob.runDailyReminders();
    } catch (err: any) {
      logger.error('[Scheduler] Error running DailyReminderJob:', err);
    }
  }, { timezone: TIMEZONE });

  // 2. Evening Nudge: Run daily at 20:00 IST
  cron.schedule('0 20 * * *', async () => {
    try {
      await EveningNudgeJob.runEveningNudge();
    } catch (err: any) {
      logger.error('[Scheduler] Error running EveningNudgeJob:', err);
    }
  }, { timezone: TIMEZONE });

  // 3. Challenge Notifications: Daily at 09:00 IST
  cron.schedule('0 9 * * *', async () => {
    try {
      await ChallengeNotificationsJob.runChallengeNotifications();
    } catch (err: any) {
      logger.error('[Scheduler] Error running ChallengeNotificationsJob:', err);
    }
  }, { timezone: TIMEZONE });

  // 4. Reader of the Month: 1st of each month at 10:00 IST
  cron.schedule('0 10 1 * *', async () => {
    try {
      await ReaderOfMonthJob.runReaderOfMonth();
    } catch (err: any) {
      logger.error('[Scheduler] Error running ReaderOfMonthJob:', err);
    }
  }, { timezone: TIMEZONE });

  // 5. Cleanup Expired Proof Photos: Daily at 03:00 IST
  cron.schedule('0 3 * * *', async () => {
    try {
      await CleanupExpiredPhotosJob.runCleanup();
    } catch (err: any) {
      logger.error('[Scheduler] Error running CleanupExpiredPhotosJob:', err);
    }
  }, { timezone: TIMEZONE });

  // 6. Expire Notices: Daily at 00:05 IST
  cron.schedule('5 0 * * *', async () => {
    try {
      await ExpireNoticesJob.runExpireNotices();
    } catch (err: any) {
      logger.error('[Scheduler] Error running ExpireNoticesJob:', err);
    }
  }, { timezone: TIMEZONE });

  // 7. Process pending proofs worker: every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await ProofWorker.processPendingProofs();
    } catch (err: any) {
      logger.error('[Scheduler] Error running ProofWorker:', err);
    }
  }, { timezone: TIMEZONE });

  logger.info('[Scheduler] All background jobs scheduled successfully.');
}
