import { User } from '../models/User';
import { ReadingLog } from '../models/ReadingLog';
import { Holiday } from '../models/Holiday';
import { Settings } from '../models/Settings';
import { differenceInDaysIST } from '../utils/dateUtils';
import mongoose from 'mongoose';

export class StreakService {
  static async calculateStreak(userId: mongoose.Types.ObjectId, dateStr: string) {
    const user = await User.findById(userId);
    if (!user) return;

    if (!user.lastLogDate) {
      user.currentStreak = 1;
      user.longestStreak = 1;
    } else {
      const diff = differenceInDaysIST(dateStr, user.lastLogDate);
      if (diff === 1) {
        user.currentStreak += 1;
        if (user.currentStreak > user.longestStreak) {
          user.longestStreak = user.currentStreak;
        }
      } else if (diff > 1) {
        // Simple implementation: break streak if diff > 1 (Freezes to be added)
        user.currentStreak = 1;
      }
    }
    
    user.lastLogDate = dateStr;
    await user.save();
    return user;
  }
}
