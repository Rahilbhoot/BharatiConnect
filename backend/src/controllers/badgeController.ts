import { Request, Response, NextFunction } from 'express';
import { Badge } from '../models/Badge';
import { UserBadge } from '../models/UserBadge';

export class BadgeController {
  static async getUserBadges(req: Request, res: Response, next: NextFunction) {
    try {
      const userBadges = await UserBadge.find({ userId: req.user!.id }).sort({ earnedAt: -1 });
      const badgeKeys = userBadges.map(ub => ub.badgeKey);

      const badges = await Badge.find({ key: { $in: badgeKeys } });
      const badgeMap = new Map(badges.map(b => [b.key, b]));

      const results = userBadges.map(ub => ({
        badgeKey: ub.badgeKey,
        earnedAt: ub.earnedAt,
        badge: badgeMap.get(ub.badgeKey) || {
          key: ub.badgeKey,
          name: { en: ub.badgeKey, mr: ub.badgeKey },
          description: { en: '', mr: '' }
        }
      }));

      res.json(results);
    } catch (err) {
      next(err);
    }
  }

  static async listAllBadges(req: Request, res: Response, next: NextFunction) {
    try {
      const badges = await Badge.find({ active: true });
      res.json(badges);
    } catch (err) {
      next(err);
    }
  }
}
