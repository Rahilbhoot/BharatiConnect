import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../src/models/User';
import { Department } from '../src/models/Department';
import { Settings } from '../src/models/Settings';
import { Book } from '../src/models/Book';
import { UserBook } from '../src/models/UserBook';
import { Challenge } from '../src/models/Challenge';
import { ChallengeEntry } from '../src/models/ChallengeEntry';
import { Post } from '../src/models/Post';
import { Role, Language, ProofMode, PostType, ChallengeType, BookStatus } from '@shared/types';
import { env } from '../src/config/env';

dotenv.config();

async function seedData() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // 1. Departments
  console.log('Seeding Departments...');
  let deptOps = await Department.findOne({ 'name.en': 'Operations' });
  if (!deptOps) {
    deptOps = await Department.create({
      name: { en: 'Operations', mr: 'कार्यकारी विभाग' },
      active: true,
    });
  }

  let deptEdu = await Department.findOne({ 'name.en': 'Education & Outreach' });
  if (!deptEdu) {
    deptEdu = await Department.create({
      name: { en: 'Education & Outreach', mr: 'शिक्षण आणि प्रसार' },
      active: true,
    });
  }

  let deptLib = await Department.findOne({ 'name.en': 'Library Management' });
  if (!deptLib) {
    deptLib = await Department.create({
      name: { en: 'Library Management', mr: 'ग्रंथालय व्यवस्थापन' },
      active: true,
    });
  }

  // 2. Users
  console.log('Seeding Users...');
  const ownerPasswordHash = await bcrypt.hash('Owner123!', 12);
  let owner = await User.findOne({ email: 'owner@example.com' });
  if (!owner) {
    owner = await User.create({
      name: 'Organization Owner',
      email: 'owner@example.com',
      passwordHash: ownerPasswordHash,
      role: Role.Owner,
      departmentId: deptOps._id,
      language: Language.English,
      active: true,
      twoFactorEnabled: false,
    });
    console.log('Created owner: owner@example.com / Owner123!');
  }

  const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
  let admin = await User.findOne({ email: 'admin@example.com' });
  if (!admin) {
    admin = await User.create({
      name: 'Pooja Deshmukh',
      email: 'admin@example.com',
      phone: '9822011223',
      passwordHash: adminPasswordHash,
      role: Role.Admin,
      departmentId: deptEdu._id,
      language: Language.Marathi,
      active: true,
      twoFactorEnabled: false,
    });
    console.log('Created admin: admin@example.com / Admin123!');
  }

  const staffPasswordHash = await bcrypt.hash('Staff123!', 12);
  let staffSanika = await User.findOne({ email: 'sanika@example.com' });
  if (!staffSanika) {
    staffSanika = await User.create({
      name: 'Sanika Kulkarni',
      email: 'sanika@example.com',
      phone: '9876543210',
      passwordHash: staffPasswordHash,
      role: Role.Staff,
      departmentId: deptEdu._id,
      language: Language.Marathi,
      currentStreak: 12,
      longestStreak: 15,
      points: 480,
      level: 'intermediate',
      reminderTime: '20:00',
      active: true,
      twoFactorEnabled: false,
    });
    console.log('Created staff: sanika@example.com / Staff123! (phone: 9876543210)');
  }

  let staffRohan = await User.findOne({ email: 'rohan@example.com' });
  if (!staffRohan) {
    staffRohan = await User.create({
      name: 'Rohan Patil',
      email: 'rohan@example.com',
      phone: '9876543211',
      passwordHash: staffPasswordHash,
      role: Role.Staff,
      departmentId: deptLib._id,
      language: Language.Marathi,
      currentStreak: 8,
      longestStreak: 10,
      points: 320,
      level: 'intermediate',
      reminderTime: '21:00',
      active: true,
      twoFactorEnabled: false,
    });
    console.log('Created staff: rohan@example.com / Staff123! (phone: 9876543211)');
  }

  // 3. Settings
  console.log('Seeding Settings...');
  const settings = await Settings.findOne();
  if (!settings) {
    await Settings.create({
      minimumPages: 1,
      proofMode: ProofMode.Off,
      freezesPerWeek: 1,
      defaultReminderTime: '20:00',
      nudgeTime: '20:00',
      spotCheckRate: 0.05,
      defaultLanguage: Language.Marathi,
    });
  }

  // 4. Books
  console.log('Seeding Books...');
  const booksData = [
    {
      title: 'श्यामची आई',
      author: 'साने गुरुजी',
      totalPages: 140,
      language: 'mr',
      isbn: '9788177660012',
    },
    {
      title: 'Wings of Fire',
      author: 'A.P.J. Abdul Kalam',
      totalPages: 180,
      language: 'en',
      isbn: '9788173711466',
    },
    {
      title: 'मृत्युंजय',
      author: 'शिवाजी सावंत',
      totalPages: 628,
      language: 'mr',
      isbn: '9788177662030',
    },
    {
      title: 'Atomic Habits',
      author: 'James Clear',
      totalPages: 320,
      language: 'en',
      isbn: '9780735211292',
    },
    {
      title: 'कोसला',
      author: 'भालचंद्र नेमाडे',
      totalPages: 260,
      language: 'mr',
      isbn: '9788171850112',
    },
  ];

  const seededBooks: any[] = [];
  for (const b of booksData) {
    let bookDoc = await Book.findOne({ title: b.title });
    if (!bookDoc) {
      bookDoc = await Book.create(b);
    }
    seededBooks.push(bookDoc);
  }

  // 5. User Shelf for Sanika
  console.log('Seeding Shelf...');
  if (staffSanika && seededBooks.length >= 2) {
    await UserBook.findOneAndUpdate(
      { userId: staffSanika._id, bookId: seededBooks[0]._id },
      {
        userId: staffSanika._id,
        bookId: seededBooks[0]._id,
        status: BookStatus.Reading,
        currentPage: 42,
        startedAt: new Date(Date.now() - 7 * 86400000),
      },
      { upsert: true, new: true }
    );

    await UserBook.findOneAndUpdate(
      { userId: staffSanika._id, bookId: seededBooks[1]._id },
      {
        userId: staffSanika._id,
        bookId: seededBooks[1]._id,
        status: BookStatus.WantToRead,
        currentPage: 0,
      },
      { upsert: true, new: true }
    );

    if (seededBooks.length >= 4) {
      await UserBook.findOneAndUpdate(
        { userId: staffSanika._id, bookId: seededBooks[3]._id },
        {
          userId: staffSanika._id,
          bookId: seededBooks[3]._id,
          status: BookStatus.Finished,
          currentPage: 320,
          rating: 5,
          review: 'Must-read guide on habit building and daily persistence!',
          finishedAt: new Date(Date.now() - 14 * 86400000),
        },
        { upsert: true, new: true }
      );
    }
  }

  // 6. Challenges
  console.log('Seeding Challenges...');
  const now = new Date();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  let chalPages = await Challenge.findOne({ 'title.en': 'Read 500 pages this month' });
  if (!chalPages) {
    chalPages = await Challenge.create({
      title: { en: 'Read 500 pages this month', mr: 'या महिन्यात ५०० पाने वाचा' },
      description: {
        en: 'Challenge yourself to read 500 pages across any books this month.',
        mr: 'या महिन्यात कोणत्याही पुस्तकांमधून ५०० पाने वाचून स्वतःला आव्हान द्या.',
      },
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: monthEnd,
      type: ChallengeType.IndividualPages,
      target: 500,
      rewardPoints: 300,
      active: true,
      createdBy: owner!._id,
    });
  }

  // Join Sanika into the challenge
  if (staffSanika && chalPages) {
    await ChallengeEntry.findOneAndUpdate(
      { userId: staffSanika._id, challengeId: chalPages._id },
      {
        userId: staffSanika._id,
        challengeId: chalPages._id,
        progress: 318,
        completed: false,
        joinedAt: new Date(now.getFullYear(), now.getMonth(), 1),
      },
      { upsert: true }
    );
  }

  // 7. Notices & Posts
  console.log('Seeding Notices and Posts...');
  const noticeTitle = 'Akshar Bharati Monthly Reading Habit Drive';
  let notice = await Post.findOne({ 'title.en': noticeTitle });
  if (!notice) {
    await Post.create({
      type: PostType.Notice,
      title: {
        en: noticeTitle,
        mr: 'अक्षर भारती मासिक वाचन सवय मोहीम',
      },
      body: {
        en: 'All staff members are encouraged to read for at least 15 minutes daily. Every page counts toward your team streak!',
        mr: 'सर्व कर्मचाऱ्यांनी दररोज किमान १५ मिनिटे वाचन करावे. प्रत्येक पान तुमच्या विभागाच्या ध्येयासाठी महत्त्वाचे आहे!',
      },
      pinned: true,
      publishedAt: new Date(),
      createdBy: owner!._id,
    });
  }

  console.log('Done seeding database with initial demo & real records.');
  process.exit(0);
}

seedData().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
