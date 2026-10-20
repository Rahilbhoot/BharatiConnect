import { User } from '../models/User';
import { ReadingLog } from '../models/ReadingLog';
import { NotificationService } from '../services/notificationService';
import { Role, NotificationType, Language } from '@shared/types';
import { getTodayDateString, TIMEZONE } from '../utils/dateUtils';
import { format, toZonedTime } from 'date-fns-tz';

export class DailyReminderJob {
  /**
   * PRD Reading-06, Notify-02: Check every minute and send daily reminder to staff
   * whose chosen reminderTime matches the current IST time and who haven't logged today.
   */
  static async runDailyReminders() {
    const now = new Date();
    const currentTimeIST = format(toZonedTime(now, TIMEZONE), 'HH:mm');
    const todayStr = getTodayDateString();

    const candidateUsers = await User.find({
      role: Role.Staff,
      active: true,
      reminderTime: currentTimeIST
    });

    if (candidateUsers.length === 0) return 0;

    // Check which users have not logged today
    const candidateIds = candidateUsers.map(u => u._id);
    const todayLogs = await ReadingLog.find({
      userId: { $in: candidateIds },
      date: todayStr
    }).select('userId');

    const loggedUserIds = new Set(todayLogs.map(l => l.userId.toString()));
    const usersToRemind = candidateUsers.filter(u => !loggedUserIds.has(u._id.toString()));

    for (const user of usersToRemind) {
      const isMarathi = user.language === Language.Marathi;
      const title = isMarathi ? 'वेळ झाली वाचनाची! 📖' : 'Time to Read! 📖';
      const body = isMarathi
        ? 'आज किमान एक पान वाचून तुमची मालिका चालू ठेवा.'
        : 'Read at least one page today to keep your streak alive.';

      // Send push notification
      await NotificationService.sendPush(user._id, title, body, {
        type: NotificationType.DailyReminder,
        date: todayStr
      });

      // Create in-app notification
      await NotificationService.createInAppNotification(
        user._id,
        NotificationType.DailyReminder,
        title,
        body,
        { date: todayStr }
      );
    }

    return usersToRemind.length;
  }
}
