export enum Role {
  Owner = 'owner',
  Admin = 'admin',
  Staff = 'staff'
}

export enum BookStatus {
  WantToRead = 'want_to_read',
  Reading = 'reading',
  Finished = 'finished'
}

export enum ProofMode {
  Off = 'off',
  Optional = 'optional',
  Required = 'required'
}

export enum ProofOutcome {
  Accepted = 'accepted',
  Retake = 'retake',
  NeedsReview = 'needs_review'
}

export enum PostType {
  Notice = 'notice',
  Update = 'update'
}

export enum NoticePriority {
  Normal = 'normal',
  Urgent = 'urgent'
}

export enum ChallengeType {
  IndividualPages = 'individual_pages',
  IndividualDays = 'individual_days',
  CollectiveDays = 'collective_days'
}

export enum SuggestionStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected'
}

export enum HolidayType {
  Holiday = 'holiday',
  Leave = 'leave'
}

export enum NotificationType {
  DailyReminder = 'daily_reminder',
  EveningNudge = 'evening_nudge',
  NoticePublished = 'notice_published',
  ChallengeStarted = 'challenge_started',
  ChallengeEnding = 'challenge_ending',
  BadgeEarned = 'badge_earned'
}

export enum VideoCategory {
  Writing = 'writing',
  Spreadsheets = 'spreadsheets',
  Translation = 'translation',
  DonorReports = 'donor_reports',
  SocialMedia = 'social_media'
}

export enum Language {
  English = 'en',
  Marathi = 'mr'
}
