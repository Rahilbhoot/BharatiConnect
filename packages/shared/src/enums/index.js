"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Language = exports.VideoCategory = exports.NotificationType = exports.HolidayType = exports.SuggestionStatus = exports.ChallengeType = exports.NoticePriority = exports.PostType = exports.ProofOutcome = exports.ProofMode = exports.BookStatus = exports.Role = void 0;
var Role;
(function (Role) {
    Role["Owner"] = "owner";
    Role["Admin"] = "admin";
    Role["Staff"] = "staff";
})(Role || (exports.Role = Role = {}));
var BookStatus;
(function (BookStatus) {
    BookStatus["WantToRead"] = "want_to_read";
    BookStatus["Reading"] = "reading";
    BookStatus["Finished"] = "finished";
})(BookStatus || (exports.BookStatus = BookStatus = {}));
var ProofMode;
(function (ProofMode) {
    ProofMode["Off"] = "off";
    ProofMode["Optional"] = "optional";
    ProofMode["Required"] = "required";
})(ProofMode || (exports.ProofMode = ProofMode = {}));
var ProofOutcome;
(function (ProofOutcome) {
    ProofOutcome["Accepted"] = "accepted";
    ProofOutcome["Retake"] = "retake";
    ProofOutcome["NeedsReview"] = "needs_review";
})(ProofOutcome || (exports.ProofOutcome = ProofOutcome = {}));
var PostType;
(function (PostType) {
    PostType["Notice"] = "notice";
    PostType["Update"] = "update";
})(PostType || (exports.PostType = PostType = {}));
var NoticePriority;
(function (NoticePriority) {
    NoticePriority["Normal"] = "normal";
    NoticePriority["Urgent"] = "urgent";
})(NoticePriority || (exports.NoticePriority = NoticePriority = {}));
var ChallengeType;
(function (ChallengeType) {
    ChallengeType["IndividualPages"] = "individual_pages";
    ChallengeType["IndividualDays"] = "individual_days";
    ChallengeType["CollectiveDays"] = "collective_days";
})(ChallengeType || (exports.ChallengeType = ChallengeType = {}));
var SuggestionStatus;
(function (SuggestionStatus) {
    SuggestionStatus["Pending"] = "pending";
    SuggestionStatus["Approved"] = "approved";
    SuggestionStatus["Rejected"] = "rejected";
})(SuggestionStatus || (exports.SuggestionStatus = SuggestionStatus = {}));
var HolidayType;
(function (HolidayType) {
    HolidayType["Holiday"] = "holiday";
    HolidayType["Leave"] = "leave";
})(HolidayType || (exports.HolidayType = HolidayType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["DailyReminder"] = "daily_reminder";
    NotificationType["EveningNudge"] = "evening_nudge";
    NotificationType["NoticePublished"] = "notice_published";
    NotificationType["ChallengeStarted"] = "challenge_started";
    NotificationType["ChallengeEnding"] = "challenge_ending";
    NotificationType["BadgeEarned"] = "badge_earned";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var VideoCategory;
(function (VideoCategory) {
    VideoCategory["Writing"] = "writing";
    VideoCategory["Spreadsheets"] = "spreadsheets";
    VideoCategory["Translation"] = "translation";
    VideoCategory["DonorReports"] = "donor_reports";
    VideoCategory["SocialMedia"] = "social_media";
})(VideoCategory || (exports.VideoCategory = VideoCategory = {}));
var Language;
(function (Language) {
    Language["English"] = "en";
    Language["Marathi"] = "mr";
})(Language || (exports.Language = Language = {}));
