import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../src/models/User';
import { Settings } from '../src/models/Settings';
import { Badge } from '../src/models/Badge';
import { Role, Language, ProofMode } from '@shared/types';
import { env } from '../src/config/env';

dotenv.config();

async function seedOwner() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to DB');

  const ownerEmail = process.argv[2] || 'owner@example.com';
  const ownerPassword = process.argv[3] || 'Owner123!';

  const existing = await User.findOne({ email: ownerEmail });
  if (existing) {
    console.log('Owner already exists');
  } else {
    const passwordHash = await bcrypt.hash(ownerPassword, 12);
    await User.create({
      name: 'Organization Owner',
      email: ownerEmail,
      passwordHash,
      role: Role.Owner,
      language: Language.English,
      active: true,
      twoFactorEnabled: false // Require them to set it up later
    });
    console.log(`Created owner: ${ownerEmail} / ${ownerPassword}`);
  }

  const existingSettings = await Settings.findOne();
  if (!existingSettings) {
    await Settings.create({
      minimumPages: 1,
      proofMode: ProofMode.Off,
      freezesPerWeek: 1,
      defaultReminderTime: '08:00',
      nudgeTime: '20:00',
      spotCheckRate: 0.05,
      defaultLanguage: Language.Marathi
    });
    console.log('Created default settings');
  }

  console.log('Done.');
  process.exit(0);
}

seedOwner().catch(console.error);
