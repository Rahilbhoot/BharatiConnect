import type {
  AppNotification,
  AuditEntry,
  BadgeDef,
  Book,
  Challenge,
  Department,
  HolidayEntry,
  Notice,
  Post,
  ReadingLog,
  Settings,
  Suggestion,
  User,
  Video,
} from "./types";

export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const daysAgo = (n: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

export const departments: Department[] = [
  { id: "d1", nameEn: "Education", nameMr: "शिक्षण", staffCount: 12 },
  { id: "d2", nameEn: "Field Operations", nameMr: "क्षेत्रीय कार्य", staffCount: 18 },
  { id: "d3", nameEn: "Fundraising", nameMr: "निधी संकलन", staffCount: 7 },
  { id: "d4", nameEn: "Communications", nameMr: "संवाद", staffCount: 6 },
];

export const currentUser: User = {
  id: "u1",
  name: "Sanika Deshmukh",
  email: "sanika@aksharbharati.org",
  phone: "+91 98220 11223",
  role: "staff",
  departmentId: "d1",
  active: true,
  streak: 12,
  points: 1840,
  level: 4,
  language: "mr",
  reminderTime: "07:30",
  joinedAt: iso(daysAgo(420)),
  avatarColor: "#6366f1",
};

export const adminUser: User = {
  ...currentUser,
  id: "u0",
  name: "Rahul Pawar",
  email: "rahul@aksharbharati.org",
  role: "owner",
  departmentId: "d4",
  streak: 31,
  points: 4210,
  level: 7,
  avatarColor: "#F59E0B",
};

const names = [
  "Sanika Deshmukh",
  "Amol Jadhav",
  "Priya Kulkarni",
  "Vikas Shinde",
  "Meera Patil",
  "Nilesh Gaikwad",
  "Asha Bhosale",
  "Ganesh Rane",
  "Sneha Kadam",
  "Rohit More",
  "Kavita Salunkhe",
  "Tushar Sawant",
];

export const staff: User[] = names.map((name, i) => ({
  id: i === 0 ? "u1" : `s${i}`,
  name,
  email: `${name.split(" ")[0]!.toLowerCase()}@aksharbharati.org`,
  phone: `+91 9${(820000000 + i * 13571).toString()}`,
  role: i === 1 ? "admin" : "staff",
  departmentId: departments[i % departments.length]!.id,
  active: i !== 9,
  streak: [12, 31, 7, 0, 22, 3, 45, 1, 9, 0, 16, 5][i]!,
  points: 2400 - i * 137,
  level: Math.max(1, 7 - Math.floor(i / 2)),
  language: i % 3 === 0 ? "en" : "mr",
  reminderTime: "07:30",
  joinedAt: iso(daysAgo(200 + i * 9)),
  avatarColor: ["#6366f1", "#F59E0B", "#10B981", "#ef4444", "#8b5cf6", "#0ea5e9"][i % 6]!,
}));

export const books: Book[] = [
  {
    id: "b1",
    title: "श्यामची आई",
    author: "साने गुरुजी",
    totalPages: 210,
    language: "mr",
    status: "reading",
    currentPage: 134,
    coverColor: "#6366f1",
    staffPick: true,
  },
  {
    id: "b2",
    title: "Atomic Habits",
    author: "James Clear",
    totalPages: 320,
    language: "en",
    status: "reading",
    currentPage: 88,
    coverColor: "#10B981",
  },
  {
    id: "b3",
    title: "बटाट्याची चाळ",
    author: "पु. ल. देशपांडे",
    totalPages: 148,
    language: "mr",
    status: "want_to_read",
    currentPage: 0,
    coverColor: "#F59E0B",
    shortRead: true,
  },
  {
    id: "b4",
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    totalPages: 96,
    language: "en",
    status: "want_to_read",
    currentPage: 0,
    coverColor: "#0ea5e9",
    shortRead: true,
  },
  {
    id: "b5",
    title: "मृत्युंजय",
    author: "शिवाजी सावंत",
    totalPages: 642,
    language: "mr",
    status: "finished",
    currentPage: 642,
    coverColor: "#8b5cf6",
    rating: 5,
    review: "अविस्मरणीय अनुभव.",
    staffPick: true,
  },
  {
    id: "b6",
    title: "Educated",
    author: "Tara Westover",
    totalPages: 352,
    language: "en",
    status: "finished",
    currentPage: 352,
    coverColor: "#ef4444",
    rating: 4,
  },
];

export const readingLogs: ReadingLog[] = Array.from({ length: 28 }).flatMap((_, i) => {
  if (i % 7 === 5) return [];
  const user = staff[i % staff.length]!;
  const book = books[i % 3]!;
  const from = 40 + i * 7;
  return [
    {
      id: `l${i}`,
      userId: user.id,
      userName: user.name,
      bookId: book.id,
      bookTitle: book.title,
      date: iso(daysAgo(i)),
      fromPage: from,
      toPage: from + 12 + (i % 9),
      pages: 12 + (i % 9),
      note: i % 4 === 0 ? "छान प्रकरण होते." : undefined,
      proofUrl: i % 3 === 0 ? `proof-${i}` : undefined,
      proofOutcome: i % 9 === 0 ? "needs_review" : i % 3 === 0 ? "accepted" : undefined,
    },
  ];
});

export const challenges: Challenge[] = [
  {
    id: "c1",
    titleEn: "Read 500 pages this month",
    titleMr: "या महिन्यात ५०० पाने वाचा",
    type: "individual_pages",
    target: 500,
    progress: 318,
    rewardPoints: 300,
    endsOn: iso(daysAgo(-11)),
    joined: true,
  },
  {
    id: "c2",
    titleEn: "21 days without a miss",
    titleMr: "२१ दिवस खंड न पडता",
    type: "individual_days",
    target: 21,
    progress: 12,
    rewardPoints: 250,
    endsOn: iso(daysAgo(-20)),
    joined: true,
  },
  {
    id: "c3",
    titleEn: "Team goal: 1000 reading days",
    titleMr: "संघ लक्ष्य: १००० वाचन दिवस",
    type: "collective_days",
    target: 1000,
    progress: 642,
    rewardPoints: 500,
    endsOn: iso(daysAgo(-30)),
    joined: false,
  },
];

export const badgeKeys = [
  "first_page",
  "streak_7",
  "streak_30",
  "book_finisher",
  "early_bird",
  "marathi_reader",
  "comeback",
] as const;

export const badges: BadgeDef[] = badgeKeys.map((key, i) => ({
  id: `bg${i}`,
  key,
  earned: i < 4 || i === 5,
  earnedOn: i < 4 || i === 5 ? iso(daysAgo(30 - i * 4)) : undefined,
}));

export const notices: Notice[] = [
  {
    id: "n1",
    titleEn: "Monsoon field visit rescheduled",
    titleMr: "पावसाळी क्षेत्रभेट पुढे ढकलली",
    bodyEn: "The Satara field visit moves to next Tuesday. Please confirm your travel plans today.",
    bodyMr: "साताऱ्याची क्षेत्रभेट पुढील मंगळवारी होईल. कृपया आजच प्रवासाची नोंद करा.",
    priority: "urgent",
    pinned: true,
    read: false,
    publishedAt: iso(daysAgo(0)),
  },
  {
    id: "n2",
    titleEn: "New reading room at Pune office",
    titleMr: "पुणे कार्यालयात नवे वाचनालय",
    bodyEn: "A quiet reading corner is now open on the second floor from 9am to 7pm.",
    bodyMr: "दुसऱ्या मजल्यावर शांत वाचन कोपरा सकाळी ९ ते संध्याकाळी ७ पर्यंत खुला.",
    priority: "normal",
    pinned: false,
    read: false,
    publishedAt: iso(daysAgo(3)),
  },
  {
    id: "n3",
    titleEn: "Salary slips available",
    titleMr: "वेतन पावत्या उपलब्ध",
    bodyEn: "August slips are shared over email. Reach out to accounts for corrections.",
    bodyMr: "ऑगस्टच्या पावत्या ईमेलवर पाठवल्या आहेत. दुरुस्तीसाठी लेखा विभागाशी संपर्क साधा.",
    priority: "normal",
    pinned: false,
    read: true,
    publishedAt: iso(daysAgo(9)),
  },
];

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/600`;

export const posts: Post[] = [
  {
    id: "p1",
    authorName: "Meera Patil",
    bodyEn: "120 children joined our new library circle in Junnar this week.",
    bodyMr: "जुन्नरमध्ये या आठवड्यात १२० मुले आमच्या नव्या वाचन गटात सहभागी झाली.",
    images: [img("ab1"), img("ab2"), img("ab3")],
    publishedAt: iso(daysAgo(1)),
  },
  {
    id: "p2",
    authorName: "Nilesh Gaikwad",
    bodyEn: "Teacher training completed across 6 villages.",
    bodyMr: "६ गावांमध्ये शिक्षक प्रशिक्षण पूर्ण झाले.",
    images: [img("ab4"), img("ab5")],
    publishedAt: iso(daysAgo(4)),
  },
];

export const videos: Video[] = [
  {
    id: "v1",
    titleEn: "Writing donor updates that land",
    titleMr: "प्रभावी देणगीदार अहवाल लेखन",
    youtubeId: "ysz5S6PUM-U",
    category: "donor_reports",
    language: "en",
    watched: false,
    pinnedTip: true,
  },
  {
    id: "v2",
    titleEn: "Spreadsheet basics for field data",
    titleMr: "क्षेत्रीय माहितीसाठी स्प्रेडशीट मूलतत्त्वे",
    youtubeId: "aqz-KE-bpKQ",
    category: "spreadsheets",
    language: "mr",
    watched: true,
  },
  {
    id: "v3",
    titleEn: "Marathi translation craft",
    titleMr: "मराठी अनुवाद कौशल्य",
    youtubeId: "ScMzIvxBSi4",
    category: "translation",
    language: "mr",
    watched: false,
  },
  {
    id: "v4",
    titleEn: "Social media for NGOs",
    titleMr: "स्वयंसेवी संस्थांसाठी सोशल मीडिया",
    youtubeId: "L_jWHffIx5E",
    category: "social_media",
    language: "en",
    watched: false,
  },
  {
    id: "v5",
    titleEn: "Clear writing habits",
    titleMr: "स्पष्ट लेखनाची सवय",
    youtubeId: "9bZkp7q19f0",
    category: "writing",
    language: "mr",
    watched: false,
  },
];

export const suggestions: Suggestion[] = [
  { id: "sg1", title: "व्यक्ती आणि वल्ली", author: "पु. ल. देशपांडे", byName: "Amol Jadhav", status: "pending" },
  { id: "sg2", title: "Deep Work", author: "Cal Newport", byName: "Priya Kulkarni", status: "approved" },
  { id: "sg3", title: "कोसला", author: "भालचंद्र नेमाडे", byName: "Vikas Shinde", status: "pending" },
];

export const holidays: HolidayEntry[] = [
  { id: "h1", date: iso(daysAgo(6)), type: "holiday", labelEn: "Ganesh Chaturthi", labelMr: "गणेश चतुर्थी" },
  { id: "h2", date: iso(daysAgo(-4)), type: "holiday", labelEn: "Founders Day", labelMr: "स्थापना दिन" },
  { id: "h3", date: iso(daysAgo(2)), type: "leave", labelEn: "Casual leave", labelMr: "किरकोळ रजा", userId: "u1" },
];

export const notifications: AppNotification[] = [
  {
    id: "nt1",
    type: "daily_reminder",
    titleEn: "Time for today's pages",
    titleMr: "आजच्या पानांची वेळ",
    at: iso(daysAgo(0)),
    read: false,
  },
  {
    id: "nt2",
    type: "badge_earned",
    titleEn: "You earned Marathi Reader",
    titleMr: "तुम्हाला मराठी वाचक बॅज मिळाला",
    at: iso(daysAgo(1)),
    read: false,
  },
  {
    id: "nt3",
    type: "notice_published",
    titleEn: "New urgent notice published",
    titleMr: "नवी तातडीची सूचना प्रकाशित",
    at: iso(daysAgo(1)),
    read: true,
  },
  {
    id: "nt4",
    type: "challenge_ending",
    titleEn: "Monthly challenge ends soon",
    titleMr: "मासिक आव्हान लवकरच संपेल",
    at: iso(daysAgo(2)),
    read: true,
  },
];

export const auditLog: AuditEntry[] = [
  {
    id: "a1",
    actor: "Rahul Pawar",
    action: "settings.update",
    target: "proofMode",
    at: iso(daysAgo(1)),
    before: "optional",
    after: "required",
  },
  {
    id: "a2",
    actor: "Amol Jadhav",
    action: "proof.accept",
    target: "log l9 — Sneha Kadam",
    at: iso(daysAgo(2)),
    before: "needs_review",
    after: "accepted",
  },
  {
    id: "a3",
    actor: "Rahul Pawar",
    action: "staff.deactivate",
    target: "Rohit More",
    at: iso(daysAgo(5)),
    before: "active",
    after: "inactive",
  },
];

export const settings: Settings = {
  minimumPages: 10,
  proofMode: "optional",
  freezesPerWeek: 1,
  reminderTime: "07:30",
  nudgeTime: "20:30",
  spotCheckRate: 20,
  defaultLanguage: "mr",
};

export const dayStates: Record<string, "logged" | "missed" | "frozen" | "holiday"> = (() => {
  const map: Record<string, "logged" | "missed" | "frozen" | "holiday"> = {};
  for (let i = 1; i < 45; i++) {
    const key = iso(daysAgo(i));
    if (i % 13 === 0) map[key] = "frozen";
    else if (i === 6) map[key] = "holiday";
    else if (i % 7 === 5) map[key] = "missed";
    else map[key] = "logged";
  }
  return map;
})();
