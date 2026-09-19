import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import { randomUUID } from 'crypto';
import { User, IUser } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { env } from '../config/env';
import { UnauthorizedError, ValidationError, NotFoundError } from '../utils/AppError';
import { Role } from '@shared/types';
import ms from 'ms';

export class AuthService {
  static async login(identifier: string, passwordString: string) {
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) throw new UnauthorizedError('Invalid credentials');
    if (!user.active) throw new UnauthorizedError('Account is deactivated');
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new UnauthorizedError(`Account locked until ${user.lockoutUntil.toISOString()}`);
    }

    const isValid = await bcrypt.compare(passwordString, user.passwordHash);

    if (!isValid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();
      throw new UnauthorizedError('Invalid credentials');
    }

    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;
    await user.save();

    const requiresTwoFactor = (user.role === Role.Admin || user.role === Role.Owner) && user.twoFactorEnabled;
    if (requiresTwoFactor) {
      const tempToken = jwt.sign({ id: user.id, role: user.role, requires2FA: true }, env.JWT_ACCESS_SECRET, { expiresIn: '5m' });
      return { requiresTwoFactor: true, tempToken };
    }

    return await this.generateTokens(user);
  }

  static async verifyTwoFactorLogin(tempToken: string, code: string) {
    try {
      const decoded = jwt.verify(tempToken, env.JWT_ACCESS_SECRET) as any;
      if (!decoded.requires2FA) throw new UnauthorizedError('Invalid token');
      
      const user = await User.findById(decoded.id);
      if (!user || !user.twoFactorSecret) throw new UnauthorizedError('User or 2FA not found');

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code
      });

      if (!verified) throw new UnauthorizedError('Invalid 2FA code');
      return await this.generateTokens(user);
    } catch(err) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  static async generateTokens(user: IUser) {
    const payload = { id: user.id, role: user.role, email: user.email, phone: user.phone };
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY as any });
    
    const family = randomUUID();
    const tokenRaw = randomUUID();
    const tokenHash = await bcrypt.hash(tokenRaw, 10);
    const expiresAt = new Date(Date.now() + Number(ms(env.JWT_REFRESH_EXPIRY as any)));

    await RefreshToken.create({ userId: user.id, token: tokenHash, family, expiresAt });

    return {
      accessToken,
      refreshToken: `${family}:${tokenRaw}`,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        departmentId: user.departmentId,
        language: user.language
      }
    };
  }

  static async refresh(refreshTokenString: string) {
    const [family, tokenRaw] = refreshTokenString.split(':');
    if (!family || !tokenRaw) throw new UnauthorizedError('Invalid refresh token');

    const tokenDocs = await RefreshToken.find({ family }).sort({ createdAt: -1 });
    if (tokenDocs.length === 0) throw new UnauthorizedError('Invalid refresh token');

    let validDoc = null;
    for (const doc of tokenDocs) {
      if (await bcrypt.compare(tokenRaw, doc.token)) {
        validDoc = doc;
        break;
      }
    }

    if (!validDoc) throw new UnauthorizedError('Invalid refresh token');
    if (validDoc.revoked) {
      // Reuse detected, revoke entire family
      await RefreshToken.updateMany({ family }, { revoked: true });
      throw new UnauthorizedError('Refresh token reused - family revoked');
    }
    if (validDoc.expiresAt < new Date()) throw new UnauthorizedError('Refresh token expired');

    // Revoke old token and issue new
    validDoc.revoked = true;
    await validDoc.save();

    const user = await User.findById(validDoc.userId);
    if (!user || !user.active) throw new UnauthorizedError('User deactivated');

    const payload = { id: user.id, role: user.role, email: user.email, phone: user.phone };
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY as any });
    
    const newTokenRaw = randomUUID();
    const newTokenHash = await bcrypt.hash(newTokenRaw, 10);
    const expiresAt = new Date(Date.now() + Number(ms(env.JWT_REFRESH_EXPIRY as any)));

    await RefreshToken.create({ userId: user.id, token: newTokenHash, family, expiresAt });

    return { accessToken, refreshToken: `${family}:${newTokenRaw}` };
  }

  static async logout(refreshTokenString: string) {
    const [family] = refreshTokenString.split(':');
    if (family) {
      await RefreshToken.updateMany({ family }, { revoked: true });
    }
  }

  static async acceptInvite(inviteToken: string, passwordString: string, name: string) {
    try {
      const decoded = jwt.verify(inviteToken, env.INVITE_SECRET) as { id: string };
      const user = await User.findById(decoded.id);
      
      if (!user) throw new NotFoundError('User not found');
      if (user.inviteToken !== inviteToken) throw new UnauthorizedError('Invalid or reused invite');
      
      user.passwordHash = await bcrypt.hash(passwordString, 12);
      user.name = name;
      user.inviteToken = undefined;
      user.inviteExpiresAt = undefined;
      user.active = true; // active upon joining
      
      await user.save();
      return await this.generateTokens(user);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired invite token');
    }
  }

  static async setupTwoFactor(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const secret = speakeasy.generateSecret({ name: `BharatiConnect (${user.email || user.phone})` });
    user.twoFactorSecret = secret.base32;
    await user.save();

    return { otpauth_url: secret.otpauth_url };
  }

  static async verifyTwoFactorSetup(userId: string, code: string) {
    const user = await User.findById(userId);
    if (!user || !user.twoFactorSecret) throw new NotFoundError('2FA not initialized');

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code
    });

    if (verified) {
      user.twoFactorEnabled = true;
      await user.save();
      return true;
    }
    throw new ValidationError('Invalid 2FA code');
  }
}
