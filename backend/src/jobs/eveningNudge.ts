import { User } from '../models/User';
import { ReadingLog } from '../models/ReadingLog';
import { SettingsService } from '../services/settingsService';
import { NotificationService } from '../services/notificationService';
import { Role, NotificationType, Language } from '@shared/types';
import { getTodayDateString } from '../utils/dateUtils';

export class EveningNudgeJob {
  /**
   * PRD Reading-06, Notify-02: Evening nudge sent at nudgeTime to users who haven't logged today
   */
  static async runEveningNudge() {
    const todayStr = getTodayDateString();

    const activeStaff = await User.find({
      role: Role.Staff,
      active: true
    });

    if (activeStaff.length === 0) return 0;

    const staffIds = activeStaff.map(u => u._id);
    const todayLogs = await ReadingLog.find({
      userId: { $in: staffIds },
      date: todayStr
    }).select('userId');

    const loggedUserIds = new Set(todayLogs.map(l => l.userId.toString()));
    const unloggedStaff = activeStaff.filter(u => !loggedUserIds.has(u._id.toString()));

    for (const user of unloggedStaff) {
      const isMarathi = user.language === Language.Marathi;
      const title = isMarathi ? 'संध्याकाळची आठवण! ⏳' : 'Evening Nudge! ⏳';
      const body = isMarathi
        ? 'आजचा दिवस संपण्यापूर्वी तुमचे वाचन नोंदवा आणि मालिका वाचवा.'
        : 'Log your reading before midnight to protect your reading streak!';

      await NotificationService.sendPush(user._id, title, body, {
        type: NotificationType.EveningNudge,
        date: todayStr
      });

      await NotificationService.createInAppNotification(
        user._id,
        NotificationType.EveningNudge,
        title,
        body,
        { date: todayStr }
      );
    }

    return unloggedStaff.length;
  }
}
