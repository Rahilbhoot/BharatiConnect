# Bharati Connect: Product Requirements Document

| Field | Value |
|---|---|
| Product | Bharati Connect, a staff management and reading habit app |
| Client | Akshar Bharati (non-governmental organization) |
| Context | College service-learning project |
| Version | 0.1 (draft) |
| Date | September 19, 2026 |
| Status | Pending sign-off by the organization's owner |

Items marked **(assumption)** are the project team's own choices and need confirmation from the owner. Unresolved decisions are listed in Section 17.

---

## 1. Background and problem

Akshar Bharati wants its staff to build a daily book reading habit. The owner's primary request is a feature that tracks which book each staff member is reading, confirms they read at least a page or two every day, records progress daily, and turns it into a friendly challenge among staff.

Around that feature, the organization needs one place to manage staff, publish notices and work updates, share artificial intelligence learning videos, and suggest better books. The product ships as a React website and a native mobile app, in English and Marathi, with an administrator portal that only administrators can access.

## 2. Goals, non-goals, and success metrics

### Goals

1. Staff read at least one page per day and record it in under 30 seconds.
2. Reading becomes social and enjoyable through streaks, points, badges, and challenges.
3. Administrators publish notices and updates, share learning videos, and see reading engagement from one portal.
4. The whole product works in English and Marathi.
5. Reading proof is checked automatically, so administrators review only exceptions.

### Non-goals for the first version

- Video uploads and reels (dropped because of storage and bandwidth cost).
- An iOS app (deferred until the owner confirms staff use iPhones).
- Staff-created posts, direct messaging, and chat.
- Payroll, payments, or any financial features.
- Recommendations based on machine learning.

### Success metrics (all targets are assumptions)

| Metric | Target |
|---|---|
| Staff logging at least 3 reading days per week, measured 4 weeks after launch | At least 70 percent |
| Median current streak, 6 weeks after launch | At least 7 days |
| Notices read within 48 hours | At least 90 percent |
| Good photos wrongly sent back for retake | Under 5 percent |
| Check-ins sent to the administrator review queue | Under 15 percent |
| Administrator time spent reviewing proofs | Under 30 minutes per week |
| Crash-free sessions on Android | At least 99 percent |

## 3. Users, roles, and permissions

| Role | Description | How the account is created |
|---|---|---|
| Owner | One or two people at the organization. Full access, including creating administrators. | Seed script run by the project team |
| Administrator | Manages staff, content, challenges, and reviews. | Created by the owner |
| Staff | Uses the mobile app or the staff website. | Invited by an administrator through a one-time link |

| Capability | Staff | Administrator | Owner |
|---|---|---|---|
| Log reading, view own progress, leaderboards | Yes | Yes | Yes |
| Read notices, posts, videos, suggestions | Yes | Yes | Yes |
| Suggest a book | Yes | Yes | Yes |
| Invite, edit, deactivate staff | No | Yes | Yes |
| Publish notices, posts, videos | No | Yes | Yes |
| Create challenges, configure badges | No | Yes | Yes |
| Review proof photos | No | Yes | Yes |
| Change settings | No | Yes | Yes |
| Create or remove administrators | No | No | Yes |
| View audit log | No | Yes | Yes |

## 4. Scope and release plan

| Release | Timing | Contents |
|---|---|---|
| Release 1 (internal) | End of Week 6 | Authentication, staff management, language switching, bookshelf, daily check-in without photo, streak, reminders, administrator reading dashboard |
| Release 2 (full launch) | Week 12 | Everything in Release 1 plus gamification, photo proof verification, notices, posts, video page, book suggestions, push notification polish |
| Later | After launch | The "Could have" items in Section 5.12 |

Release 1 goes to real staff early so the team gets usage data before building the rest.

---

## 5. Functional requirements

Priorities: **Must have**, **Should have**, **Could have**.

### 5.1 Authentication and access

| Identifier | Priority | Requirement |
|---|---|---|
| Auth-01 | Must have | Accounts are invite-only. There is no public signup anywhere. |
| Auth-02 | Must have | Three roles: owner, administrator, staff. Permissions follow the table in Section 3. |
| Auth-03 | Must have | Login with a password. The login identifier (email or phone number) is an open question. |
| Auth-04 | Must have | Short-lived signed access tokens (15 minutes) and rotating refresh tokens (30 days). |
| Auth-05 | Must have | The server checks the role on every administrator endpoint. Hiding buttons in the interface is not access control. |
| Auth-06 | Must have | The administrator portal is a separate web app on its own subdomain and is not linked from the staff app or the staff website. |
| Auth-07 | Must have | Administrator and owner accounts require two-factor authentication (time-based one-time password). |
| Auth-08 | Must have | Five failed logins cause a 15-minute lockout **(assumption)**. |
| Auth-09 | Should have | An administrator can issue a one-time password reset link for a staff member. |
| Auth-10 | Must have | A deactivated staff member cannot log in. Their reading data stays in reports. |

### 5.2 Staff management

| Identifier | Priority | Requirement |
|---|---|---|
| Staff-01 | Must have | Administrators create a staff record (name, contact, department) and send an invite link. |
| Staff-02 | Must have | Departments with English and Marathi names. Each staff member belongs to one department. |
| Staff-03 | Must have | Administrators can edit, deactivate, and reactivate staff. |
| Staff-04 | Should have | Staff directory showing name, department, and contact for active staff. |
| Staff-05 | Could have | Bulk invite from an uploaded spreadsheet. |

### 5.3 Reading tracker

| Identifier | Priority | Requirement |
|---|---|---|
| Reading-01 | Must have | Search books through Google Books. If a book is not found, staff add it manually (title, author, total pages, language). |
| Reading-02 | Must have | Bookshelf with three statuses: Want to read, Reading, Finished. Up to 3 books can be in Reading at once **(assumption)**. |
| Reading-03 | Must have | Daily check-in: choose the book, enter the current page, optionally add a one-line note. The server calculates pages read from the previous recorded page. |
| Reading-04 | Must have | One check-in per staff member per day. A second check-in the same day updates the first. |
| Reading-05 | Must have | Streak behavior follows Section 6. |
| Reading-06 | Must have | Reminder notification at a time each staff member chooses, plus a second nudge at 20:00 if nothing is logged **(assumption)**. |
| Reading-07 | Must have | The check-in is rejected if the current page exceeds the book's total pages, or if pages read falls below the minimum. |
| Reading-08 | Should have | Calendar history view showing which days were logged. |
| Reading-09 | Should have | When the current page equals the total pages, the app offers to mark the book Finished. |
| Reading-10 | Should have | Optional weekly one-line takeaway per book, worth bonus points. |

### 5.4 Photo proof verification

Full specification is in Section 7.

| Identifier | Priority | Requirement |
|---|---|---|
| Proof-01 | Must have | An administrator setting `proofMode` with values `off`, `optional`, `required`. |
| Proof-02 | Must have | Photos are captured with the camera only (not the gallery), compressed on the device, and uploaded with the check-in. |
| Proof-03 | Must have | The server checks the photo with one vision model call and applies the decision rules in code. |
| Proof-04 | Must have | Outcomes are `accepted`, `retake`, or `needs_review`. |
| Proof-05 | Must have | Administrators only see `needs_review` items plus a 5 percent random spot-check of accepted items. |
| Proof-06 | Must have | Accepted photos are never stored. |
| Proof-07 | Must have | If the model call fails or times out, the outcome is `needs_review` and the day counts provisionally. |
| Proof-08 | Must have | Staff see a consent notice before their first photo. |

### 5.5 Gamification

Full specification is in Section 8.

| Identifier | Priority | Requirement |
|---|---|---|
| Game-01 | Should have | Points awarded for reading days, streak milestones, finished books, takeaways, and watched videos. |
| Game-02 | Should have | Five levels based on total points. |
| Game-03 | Should have | Badges awarded automatically when their rule is met. |
| Game-04 | Should have | Weekly and monthly leaderboards. The department leaderboard is the default view. |
| Game-05 | Should have | Administrator-created challenges with dates, goals, and reward points. |
| Game-06 | Should have | Automatic "Reader of the Month" post in the feed. |
| Game-07 | Could have | Reactions on milestone posts. |

### 5.6 Notices

| Identifier | Priority | Requirement |
|---|---|---|
| Notice-01 | Must have | Administrators publish notices with a title and body in English and Marathi. |
| Notice-02 | Must have | Priority (normal or urgent), pinning, and an optional expiry date. |
| Notice-03 | Must have | Publishing sends a push notification in each staff member's language. |
| Notice-04 | Should have | Read receipts. Administrators see who has not read a notice. |
| Notice-05 | Should have | One optional image per notice. |

### 5.7 Posts (work updates)

| Identifier | Priority | Requirement |
|---|---|---|
| Post-01 | Should have | Administrators publish updates with a bilingual caption and up to 5 images. |
| Post-02 | Should have | Images are compressed on the device before upload (maximum 1600 pixels wide). |
| Post-03 | Should have | Posts appear in a chronological feed on the Posts page. |
| Post-04 | Could have | Staff reactions and comments. |

Video posts and reels are out of scope.

### 5.8 Book suggestions

| Identifier | Priority | Requirement |
|---|---|---|
| Book-01 | Should have | Four tabs: Staff Picks (administrator curated), Search (Google Books), Suggested for You, Short Reads (under 150 pages). |
| Book-02 | Should have | Filters for language (Marathi, Hindi, English), genre, and page count. |
| Book-03 | Should have | "Start reading" adds the book to the bookshelf. |
| Book-04 | Should have | Staff submit book suggestions. An administrator approves or rejects each one. |
| Book-05 | Could have | After finishing a book, staff rate it from 1 to 5 with a one-line review. |

Suggested for You uses matching genre and language from the staff member's finished books. It does not use machine learning.

### 5.9 Artificial intelligence learning videos

| Identifier | Priority | Requirement |
|---|---|---|
| Video-01 | Should have | An administrator pastes a YouTube link. The server fetches the title and thumbnail through YouTube's oEmbed endpoint. |
| Video-02 | Should have | The administrator adds a category (writing, spreadsheets, translation, donor reports, social media), a language, and a bilingual description. |
| Video-03 | Should have | Staff watch the video embedded in the app. If the video cannot be embedded, the app shows an "Open in YouTube" link. |
| Video-04 | Should have | Staff mark a video as watched. Administrators see watch counts. |
| Video-05 | Could have | A pinned "Artificial intelligence tip of the week" slot. |

### 5.10 Notifications

| Identifier | Priority | Requirement |
|---|---|---|
| Notify-01 | Must have | Push notifications through Expo Notifications (Firebase Cloud Messaging on Android). |
| Notify-02 | Must have | Types: daily reminder, evening nudge, notice published, challenge started or ending, badge earned. |
| Notify-03 | Should have | In-app notification list. |
| Notify-04 | Could have | Quiet hours per staff member. |

### 5.11 Multilingual support

| Identifier | Priority | Requirement |
|---|---|---|
| Language-01 | Must have | Every interface string lives in translation files for English and Marathi. |
| Language-02 | Must have | Language switch on the login screen and in the profile. The default language is Marathi **(assumption)**. |
| Language-03 | Must have | Administrator-created content has separate English and Marathi fields. If one is empty, the other is shown. |
| Language-04 | Must have | Noto Sans Devanagari font is bundled for Marathi. |
| Language-05 | Must have | Layouts tolerate text up to 40 percent longer than English **(assumption)**. |
| Language-06 | Must have | A native Marathi speaker reviews all translations before launch. |
| Language-07 | Should have | Push notification text is sent in the recipient's language. |

### 5.12 Administrator portal

| Identifier | Priority | Requirement |
|---|---|---|
| Admin-01 | Must have | Dashboard: staff who logged today, active streaks, streak distribution, most-read books, department comparison. |
| Admin-02 | Must have | Settings: minimum pages, `proofMode`, streak freezes per week, default reminder time, nudge time, spot-check rate, default language. |
| Admin-03 | Must have | Staff management and department management (Section 5.2). |
| Admin-04 | Must have | Notice and post management (Sections 5.6 and 5.7). |
| Admin-05 | Should have | Proof review queue (Section 7). |
| Admin-06 | Should have | Challenge management, badge configuration, video management, book curation and suggestion approval. |
| Admin-07 | Should have | Holiday and leave calendar. Marked days do not break streaks. |
| Admin-08 | Should have | Reading reports for a date range, exported as a spreadsheet or a printable document. |
| Admin-09 | Should have | Audit log of every administrator action. |
| Admin-10 | Should have | Manually add a missed reading day for a staff member, with a required reason. This is written to the audit log. |
| Admin-11 | Could have | Scheduled posts and trend analytics. |

### Additional staff management features (Could have, after launch)

Event calendar, birthdays and work anniversaries, polls, document library (policies and forms), anonymous feedback box, leave requests, attendance, task assignment, book club groups, offline mode with sync, weekly digest, dark mode.

---

## 6. Reading streak specification

1. A **reading day** is a calendar day in the Asia/Kolkata timezone with a valid check-in of at least `minimumPages` (default 1).
2. Each check-in stores its date as a `YYYY-MM-DD` string. A unique index on user and date allows one record per day, and repeat check-ins that day update it (upsert).
3. Pages read = current page minus the previous recorded page for that book. If the result is below `minimumPages`, the check-in is rejected with a clear message.
4. The user record caches `currentStreak`, `longestStreak`, and `lastLogDate`. The daily records are the source of truth, and a recalculation function rebuilds the cache from them.
5. On read, if `lastLogDate` is earlier than yesterday and no freeze, leave, or holiday covers the gap, the displayed streak is 0. A day not yet logged today does not break the streak until the day ends.
6. **Streak freeze:** one per week (weeks start on Monday), consumed automatically to cover a single missed day. Unused freezes do not carry over.
7. **Excused days:** administrator-approved leave and organization holidays keep the streak alive without incrementing it.
8. **No backdating by staff.** Only administrators can add a missed day (Admin-10).
9. **Provisional days:** a check-in whose proof outcome is `needs_review` counts immediately. If an administrator rejects it, the day is removed, points are reversed through the points ledger, and the streak is recalculated.
10. `longestStreak` is never reduced by a rejection unless the removed day was part of it, in which case it is recalculated.

---

## 7. Photo proof verification specification

### 7.1 What it proves

It confirms that a printed book page was photographed, that the text is legible, that the printed page number is consistent with the claimed page, and that the photo is not reused. It does not prove the person read the page. Anyone can photograph a page without reading it. The feature is proof of effort, not proof of reading.

### 7.2 Design

The feature is a **single chain, not an agent**: one vision model call with structured output, followed by decision rules written in code. An agent (a model choosing tools in a loop) adds cost, delay, and unpredictability with no benefit for a fixed process. LangChain.js is used for the model call so the provider can be swapped by changing one import.

### 7.3 Flow

1. The app opens the camera (`launchCameraAsync`), then resizes the photo to 1280 pixels wide at JPEG quality 0.7.
2. The app sends `POST /reading/check-in` as multipart form data with `bookId`, `currentPage`, and `photo`. The server accepts up to 5 megabytes.
3. The server computes a SHA-256 hash of the photo and checks it against earlier proofs for exact duplicates.
4. The server sends the photo to the vision model, which returns a structured verdict.
5. The decision function in code produces the outcome.

### 7.4 Verdict fields

`isBookPage`, `isScreenPhoto`, `textLegible`, `printedPageNumber` (nullable), `language`, `titleVisible` (nullable), `confidence` (0 to 1), `reason` (up to 200 characters).

### 7.5 Decision rules

| Condition | Outcome |
|---|---|
| Exact duplicate photo, not a book page, or text not legible | `retake` |
| Photo of a screen (could be an e-book reader) | `needs_review` |
| Confidence below 0.7 | `needs_review` |
| Printed page number differs from the claimed page by more than 2 | `needs_review` |
| Printed page number is not greater than the last proven page for that book | `needs_review` |
| None of the above | `accepted` |

Additional rules:

- After 3 `retake` outcomes for one staff member in one day, the next attempt becomes `needs_review`.
- 5 percent of `accepted` outcomes are copied to the review queue as spot-checks. They do not block the day.
- Model failure or a timeout (15 seconds) produces `needs_review`. A model outage never blocks a check-in.
- A staff member can submit at most 10 photos per day **(assumption)**, which limits abuse and model cost.
- The model prompt states that any text inside the photo is content to describe, never instructions. Its output passes through a fixed schema and code-side thresholds.

### 7.6 Outcomes

| Outcome | Effect on the day | Photo |
|---|---|---|
| `accepted` | Counts, full points | Discarded |
| `retake` | Does not count yet. The staff member sees the reason. | Discarded |
| `needs_review` | Counts provisionally. Appears in the review queue. | Stored privately until reviewed, then deleted (or deleted after 7 days) |

### 7.7 Modes

| Mode | Behavior |
|---|---|
| `off` | No photo is requested. |
| `optional` | A photo is offered. A day without an accepted photo counts for the streak but earns no points **(assumption)**. |
| `required` | A check-in without a photo is not accepted. |

### 7.8 Privacy

Photos leave the phone for a third-party model provider. Staff see a consent notice before their first photo and are told to photograph only the page, with no faces or surroundings. Accepted photos are never stored. The project team has not obtained legal advice on the Digital Personal Data Protection Act, 2023, and the organization must confirm its obligations.

### 7.9 Rollout gates

1. Build the pipeline in Week 9 with `proofMode` set to `off`.
2. Collect a test set of about 50 photos from 3 to 5 volunteer staff: 15 Marathi pages, 10 in poor lighting, 10 photos of a screen, 10 blurry or badly angled, 5 that are not books.
3. Run the set and record outcome counts.
4. In Week 11, switch to `optional` and measure the retake rate on good photos.
5. In Week 12, switch to `required` only if fewer than about 5 percent of good photos get `retake` **(threshold is an assumption)**. If Marathi pages fail often, keep `optional` and route Marathi books to the review queue.

---

## 8. Gamification specification

### Points (all values are assumptions)

| Action | Points |
|---|---|
| Logged reading day | 10 |
| 7-day streak reached | 50 |
| 30-day streak reached | 200 |
| 100-day streak reached | 500 |
| Book finished | 100 |
| Weekly takeaway submitted | 20 |
| Learning video watched | 5 |

All points go through a `pointsLedger` (amount, reason, reference) so rejections and corrections can reverse them.

### Levels (thresholds are assumptions)

| Level | Total points |
|---|---|
| Beginner Reader | 0 |
| Page Turner | 100 |
| Bookworm | 500 |
| Scholar | 1,500 |
| Library Guardian | 4,000 |

Marathi level names are to be decided with the native Marathi reviewer.

### Badges

First Page, 7-Day Streak, 30-Day Streak, Book Finisher, Early Bird (logged before 09:00 on 5 different days), Marathi Reader (finished a Marathi book), Comeback (reached a 7-day streak after a broken one).

### Leaderboards

- Default view: department leaderboard, weekly and monthly.
- Individual leaderboard shows the top 10 plus the viewer's own rank, so the lowest-ranked staff are never publicly last.

### Challenges

Administrators create challenges with a title, description (both languages), start and end dates, type, target, and reward points.

| Type | Example |
|---|---|
| Individual pages | Read 200 pages this month |
| Individual days | Log 20 days this month |
| Collective days | Every staff member logs 5 days this week |

### Real rewards

Points without stakes fade within weeks. The owner decides what winners receive (certificates, a book gift). This is open question 3.

---

## 9. Screens and navigation

### Staff app and staff website

| Area | Screens |
|---|---|
| Access | Accept invite, login, forgot password |
| Home | Streak, today's status, quick check-in, active challenge |
| Reading | Check-in (book, page, photo), bookshelf, book detail, history calendar |
| Competition | Leaderboard, challenges, badges and level |
| Content | Notices, posts, learning videos, book suggestions |
| Account | Profile, language, reminder time, notification list |

### Administrator portal (web only)

Login with two-factor authentication, dashboard, staff list and detail, departments, reading analytics, proof review queue, challenges, badge configuration, notices, posts, videos, book curation and suggestion approvals, holiday and leave calendar, reports, settings, audit log.

---

## 10. Data model

| Collection | Key fields |
|---|---|
| `users` | name, email, phone, role, departmentId, language, reminderTime, active, currentStreak, longestStreak, lastLogDate, points, level, pushTokens, twoFactorSecret (administrators only, encrypted) |
| `departments` | name (English and Marathi) |
| `books` | title, author, totalPages, language, coverUrl, googleBooksId, staffPick, createdBy |
| `userBooks` | userId, bookId, status, currentPage, startedAt, finishedAt, rating, review |
| `readingLogs` | userId, date, bookId, startPage, currentPage, pagesRead, note, provisional, `proof` (status, verdict, imageHash, attempts, imageRef, reviewedBy, reviewedAt, spotCheck). Unique on userId and date. |
| `pointsLedger` | userId, amount, reason, referenceId, createdAt |
| `badges` | key, name and description (both languages), rule |
| `userBadges` | userId, badgeKey, earnedAt |
| `challenges` | title, description (both languages), startDate, endDate, type, target, rewardPoints, createdBy |
| `challengeEntries` | challengeId, userId, progress, completedAt |
| `posts` | type (`notice` or `update`), title, body (both languages), images, priority, pinned, expiresAt, publishedAt, createdBy |
| `postReads` | postId, userId, readAt |
| `videos` | youtubeId, title, thumbnail, category, language, description (both languages), pinnedWeek, createdBy |
| `videoViews` | videoId, userId, watchedAt |
| `bookSuggestions` | userId, title, author, reason, status, reviewedBy |
| `holidays` | date, name, type (holiday or leave), userId (null for the whole organization) |
| `notifications` | userId, type, payload, readAt |
| `auditLogs` | actorId, action, targetType, targetId, before, after, createdAt |
| `settings` | minimumPages, proofMode, freezesPerWeek, defaultReminderTime, nudgeTime, spotCheckRate, defaultLanguage |

## 11. Backend endpoints

| Group | Method and path |
|---|---|
| Authentication | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/accept-invite`, `POST /auth/two-factor/verify` |
| Staff (administrator) | `GET /admin/users`, `POST /admin/users`, `PATCH /admin/users/:id`, `POST /admin/users/:id/invite`, `POST /admin/users/:id/deactivate` |
| Books and bookshelf | `GET /books/search`, `GET /books/:id`, `POST /me/shelf`, `PATCH /me/shelf/:bookId` |
| Reading | `POST /reading/check-in` (multipart), `GET /reading/me/streak`, `GET /reading/me/history` |
| Leaderboard | `GET /leaderboard` with `scope` (department or individual) and `period` (week or month) |
| Challenges | `GET /challenges`, `POST /challenges/:id/join`, `POST /admin/challenges`, `PATCH /admin/challenges/:id` |
| Notices and posts | `GET /notices`, `POST /notices/:id/read`, `GET /posts`, `POST /admin/notices`, `POST /admin/posts`, plus `PATCH` and `DELETE` on both |
| Videos | `GET /videos`, `POST /videos/:id/watched`, `POST /admin/videos` |
| Book suggestions | `GET /suggestions/books`, `POST /suggestions/books`, `PATCH /admin/suggestions/:id` |
| Proof review | `GET /admin/proof-reviews`, `POST /admin/proof-reviews/:id/decision` |
| Administration | `GET /admin/settings`, `PATCH /admin/settings`, `GET /admin/reports/reading`, `GET /admin/audit-logs`, `POST /admin/holidays` |
| Notifications | `POST /me/push-token`, `GET /me/notifications` |

---

## 12. Technical architecture

| Layer | Choice |
|---|---|
| Repository | One monorepo: `apps/api`, `apps/web`, `apps/mobile`, `packages/shared` (types, validation schemas, translation files) |
| Backend | Node.js, Express, MongoDB with Mongoose, TypeScript, Zod validation |
| Web | React, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS |
| Native app | React Native with Expo and Expo Router |
| Administrator portal | Separate React web app on its own subdomain |
| Authentication | Invite-only, signed access tokens plus rotating refresh tokens, bcrypt password hashing |
| Images | Cloudinary, private delivery for proof photos |
| Notifications | Expo Notifications (Firebase Cloud Messaging underneath) |
| Book data | Google Books search, Open Library covers |
| Proof verification | LangChain.js with `@langchain/ollama` and structured output (Zod schema). The provider is swappable. |
| Multilingual | i18next and react-i18next on web and mobile |
| Hosting | MongoDB Atlas free tier, Render or Railway for the backend, Vercel for the web |

Free-tier backend hosting may sleep after inactivity, which makes the first request slow. Use a paid tier or a scheduled keep-alive request before launch.

---

## 13. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Staff home screen loads within 3 seconds on a mid-range Android phone over a mobile data connection **(assumption)**. Check-in without a photo completes within 2 seconds. Check-in with a photo completes within 10 seconds. |
| Capacity | Designed for up to 200 staff **(assumption)** |
| Security | Encrypted connections only. Passwords hashed with bcrypt. Login rate limiting. Input validation with Zod. Restricted cross-origin access. Secrets in environment variables. Two-factor authentication for administrators. Audit log for administrator actions. |
| Privacy | Collect only name, contact, department, and reading data. Accepted proof photos are never stored. Pending photos are deleted after review or after 7 days. Consent notice before the first photo. |
| Accessibility | Touch targets of at least 48 pixels. Layouts remain usable at 130 percent system font size. Sufficient text contrast. |
| Localization | English and Marathi throughout. Numbers shown in Western Arabic numerals in both languages **(assumption)**. |
| Device support | Android 8 or newer **(assumption)**. Current and previous versions of Chrome, Edge, Firefox, and Safari. |
| Offline | Release 1 requires a connection and shows a clear error when offline. Offline mode with sync is a Could have. |
| Reliability | Model provider failure never blocks a check-in (Proof-07). Weekly export of the database **(assumption)**. |

---

## 14. Delivery plan (12 weeks, team of 3 to 4 people, both assumptions)

| Weeks | Phase | Deliverable |
|---|---|---|
| 1 | Planning | Signed-off requirements, wireframes for the 8 core screens, repository and hosting set up |
| 2 to 3 | Foundation | Authentication, roles, staff invite and management, language switcher, shells for the staff app and administrator portal |
| 4 to 6 | Reading core | Book search, bookshelf, daily check-in, streak engine, reminders, staff home screen, administrator reading dashboard. **Release 1 to staff at the end of Week 6.** |
| 7 to 8 | Gamification | Points, levels, badges, leaderboards, challenges |
| 9 | Proof pipeline | Photo verification and review queue, with `proofMode` set to `off` |
| 10 | Content | Notices, posts, learning video page, book suggestions (cut the Suggested for You tab if this slips) |
| 11 | Hardening | Testing on physical low-end Android phones, Marathi review, proof test-set run, switch `proofMode` to `optional` |
| 12 | Launch | Deployment, staff onboarding session, feedback form, handover documentation. Switch to `required` only if the Section 7.9 gate is met. |

Roles: backend, web, mobile, and design with testing. One person may hold more than one role.

---

## 15. Testing and launch acceptance

### Testing

- Unit tests for the streak engine: midnight boundary, freeze use, holidays and leave, rejection rollback, duplicate check-ins, page count above the total.
- Automated access tests: every administrator endpoint returns unauthorized without a token and forbidden with a staff token.
- Decision function tests for every row of Section 7.5.
- Manual testing on at least 3 physical Android devices, one of them low-end.
- Marathi layout check for text overflow.
- Proof test-set run with recorded outcomes (Section 7.9).

### Launch checklist

- [ ] All Must have requirements pass testing.
- [ ] Marathi translations reviewed by a native speaker.
- [ ] Proof test-set results recorded and `proofMode` decision made.
- [ ] Administrator portal verified as unreachable without an administrator account.
- [ ] All staff accounts invited, and the onboarding session held.
- [ ] Hosting, database, model provider, and Cloudinary accounts owned by the organization, not by a student.
- [ ] Handover documentation delivered (setup, deployment, administrator guide).

---

## 16. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Staff are uncomfortable with smartphones | Test paper wireframes with 3 real staff in Week 3. Large buttons, Marathi as the default language. |
| Daily photo adds friction and hurts the habit | `proofMode` is configurable. Roll out `optional` before `required`. |
| Photo proof does not prove reading | State the limit plainly to the owner. Keep the weekly takeaway as a bonus. |
| Marathi text recognition is weak | Test on real Marathi pages. Keep `optional` or route Marathi books to review if results are poor. |
| False retakes frustrate staff | Retake limit of 3, then human review. Measure the false retake rate before `required`. |
| Staff try to trick the model (held-up notes, reused photos) | Fixed output schema, code-side thresholds, duplicate hash, page number progression check, 5 percent spot-checks. |
| Model provider outage or spending | Failure routes to `needs_review`. Daily submission cap. Set a spending limit on the provider account. |
| Public last place discourages low performers | Department leaderboard by default. Individual view shows top 10 and own rank only. |
| Scope exceeds 12 weeks | Cut the Could have items without debate. Release 1 at Week 6 keeps the core safe. |
| Free-tier hosting sleeps or hits limits | Paid tier or keep-alive before launch. Monitor storage and usage. |
| Staff personal data mishandled | Collect the minimum. Delete pending photos after review. Confirm obligations with the organization. |
| Project owner leaves after the college term | Accounts owned by the organization. Handover documentation. Named maintainer on the organization's side. |

## 17. Open questions for the owner

1. How many staff are there, and do all of them have Android phones?
2. What is the daily minimum in pages, and do weekends and holidays count?
3. What real rewards will winners receive?
4. Can staff create posts later, or only administrators?
5. Which book languages are needed (Marathi, Hindi, English)?
6. Who are the administrators, and how many?
7. Do staff log in with an email address or a phone number?
8. Who will own the hosting, database, and model provider accounts after handover, and who pays for them?
9. Who will review the Marathi translations?
10. Who supplies the organization holiday calendar?
11. In `optional` mode, should a day without a photo earn no points, or reduced points?

## 18. Decision log

| Decision | Reason |
|---|---|
| Reels dropped. The app has notices and posts only. | Video storage and bandwidth cost. |
| Photo proof uses one vision model call with structured output, not an agent. | The process is fixed. An agent adds cost and unpredictability. |
| Administrator portal is web only, on a separate subdomain. | Smaller attack surface. Administrator tasks do not need mobile. |
| Android and web first, iOS deferred. | Apple requires a paid annual membership and app review. Staff device use is unconfirmed. |
| Department leaderboard is the default. | Avoids public last place. |
| `needs_review` days count provisionally. | Slow reviewers must not break streaks. |
| `proofMode` is an administrator setting with three values. | Lets the organization tune friction against trust. |
| Release 1 goes to staff at Week 6. | Real usage data before building the rest. |

## 19. Glossary

| Term | Meaning |
|---|---|
| Reading day | A calendar day (Asia/Kolkata timezone) with a valid check-in meeting the minimum pages |
| Streak | Consecutive reading days, counting excused days without incrementing |
| Streak freeze | An automatic weekly allowance that covers one missed day |
| Proof | A camera photo of the page read, submitted with a check-in |
| Verdict | The structured result the vision model returns for a photo |
| Outcome | The decision (`accepted`, `retake`, `needs_review`) produced by rules in code |
| Provisional day | A reading day counted immediately while its proof awaits administrator review |
| Spot-check | A random accepted photo copied to the review queue for administrator confirmation |