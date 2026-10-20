import { Settings, ISettings } from '../models/Settings';
import { AuditLog } from '../models/AuditLog';
import { ProofMode, Language } from '@shared/types';
import mongoose from 'mongoose';

export class SettingsService {
  /**
   * PRD Admin-02: Get organization settings singleton
   */
  static async getSettings(): Promise<ISettings> {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        minimumPages: 1,
        proofMode: ProofMode.Off,
        freezesPerWeek: 1,
        defaultReminderTime: '08:00',
        nudgeTime: '20:00',
        spotCheckRate: 0.05,
        defaultLanguage: Language.Marathi
      });
    }
    return settings;
  }

  /**
   * PRD Admin-02: Update organization settings
   */
  static async updateSettings(updates: Partial<ISettings>, adminId: string): Promise<ISettings> {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    const before = settings.toObject();

    if (updates.minimumPages !== undefined) settings.minimumPages = updates.minimumPages;
    if (updates.proofMode !== undefined) settings.proofMode = updates.proofMode;
    if (updates.freezesPerWeek !== undefined) settings.freezesPerWeek = updates.freezesPerWeek;
    if (updates.defaultReminderTime !== undefined) settings.defaultReminderTime = updates.defaultReminderTime;
    if (updates.nudgeTime !== undefined) settings.nudgeTime = updates.nudgeTime;
    if (updates.spotCheckRate !== undefined) settings.spotCheckRate = updates.spotCheckRate;
    if (updates.defaultLanguage !== undefined) settings.defaultLanguage = updates.defaultLanguage;

    await settings.save();

    await AuditLog.create({
      actorId: new mongoose.Types.ObjectId(adminId),
      action: 'UPDATE_SETTINGS',
      targetType: 'Settings',
      targetId: settings._id,
      before,
      after: settings.toObject()
    });

    return settings;
  }
}
