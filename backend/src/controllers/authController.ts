import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier, password } = req.body;
      const result = await AuthService.login(identifier, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async verifyTwoFactor(req: Request, res: Response, next: NextFunction) {
    try {
      const { tempToken, code } = req.body;
      const result = await AuthService.verifyTwoFactorLogin(tempToken, code);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refresh(refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) await AuthService.logout(refreshToken);
      res.json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async acceptInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const { inviteToken, password, name } = req.body;
      const result = await AuthService.acceptInvite(inviteToken, password, name);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async setupTwoFactor(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('Not authenticated');
      const result = await AuthService.setupTwoFactor(req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async verifyTwoFactorSetup(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new Error('Not authenticated');
      const { code } = req.body;
      await AuthService.verifyTwoFactorSetup(req.user.id, code);
      res.json({ message: '2FA enabled successfully' });
    } catch (err) {
      next(err);
    }
  }
}
