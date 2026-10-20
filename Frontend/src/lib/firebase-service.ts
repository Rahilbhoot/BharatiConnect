import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  limit,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import * as demo from "./demo-data";
import type {
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
  WeeklyTakeaway,
} from "./types";

export async function seedFirestoreIfEmpty() {
  if (typeof window === "undefined") return;
  const settingsRef = doc(db, "settings", "habitRules");
  try {
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      return; // Already initialized
    }
  } catch (err) {
    console.warn("Could not check settings seed existence:", err);
  }

  try {
    // Seed settings
    await setDoc(doc(db, "settings", "habitRules"), demo.settings);

    // Seed departments
    for (const d of demo.departments) {
      await setDoc(doc(db, "departments", d.id), d);
    }

    // Seed books
    for (const b of demo.books) {
      await setDoc(doc(db, "books", b.id), b);
    }

    // Seed challenges
    for (const c of demo.challenges) {
      await setDoc(doc(db, "challenges", c.id), c);
    }

    // Seed notices
    for (const n of demo.notices) {
      await setDoc(doc(db, "notices", n.id), n);
    }

    // Seed posts
    for (const p of demo.posts) {
      await setDoc(doc(db, "posts", p.id), p);
    }

    // Seed videos
    for (const v of demo.videos) {
      await setDoc(doc(db, "videos", v.id), v);
    }

    // Seed suggestions
    for (const s of demo.suggestions) {
      await setDoc(doc(db, "suggestions", s.id), s);
    }

    // Seed holidays
    for (const h of demo.holidays) {
      await setDoc(doc(db, "holidays", h.id), h);
    }

    // Seed initial users
    for (const u of demo.staff) {
      await setDoc(doc(db, "users", u.id), u);
    }
    console.log("Firestore successfully seeded with initial BharatiConnect data.");
  } catch (error) {
    console.warn("Seed skipped or partially applied:", error);
  }
}

export function subscribeToFirestore(updateState: (partial: any) => void) {
  if (typeof window === "undefined") return () => {};

  const unsubs: (() => void)[] = [];

  const bind = <T>(
    collName: string,
    key: string,
    mapFn?: (docData: any, id: string) => T,
  ) => {
    try {
      const q = query(collection(db, collName), limit(100));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((d) =>
            mapFn ? mapFn(d.data(), d.id) : { id: d.id, ...d.data() },
          );
          if (items.length > 0) {
            updateState({ [key]: items });
          }
        },
        (error) => {
          console.warn(`Firestore subscription failed on ${collName}:`, error.message);
        },
      );
      unsubs.push(unsub);
    } catch (e) {
      console.warn(`Failed to bind collection ${collName}`, e);
    }
  };

  bind<Department>("departments", "departments");
  bind<Book>("books", "books");
  bind<Challenge>("challenges", "challenges");
  bind<Notice>("notices", "notices");
  bind<Post>("posts", "posts");
  bind<Video>("videos", "videos");
  bind<Suggestion>("suggestions", "suggestions");
  bind<HolidayEntry>("holidays", "holidays");
  bind<ReadingLog>("reading_logs", "logs");
  bind<User>("users", "staff");

  // Settings single document subscription
  try {
    const unsubSettings = onSnapshot(
      doc(db, "settings", "habitRules"),
      (snap) => {
        if (snap.exists()) {
          updateState({ settings: snap.data() as Settings });
        }
      },
      (error) => {
        console.warn("Settings subscription error:", error.message);
      },
    );
    unsubs.push(unsubSettings);
  } catch {}

  return () => {
    unsubs.forEach((u) => u());
  };
}

// Write mutations to Firestore with hardened error handling
export async function fsSaveReadingLog(log: ReadingLog) {
  const path = `reading_logs/${log.id}`;
  try {
    await setDoc(doc(db, "reading_logs", log.id), log);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fsSaveBook(book: Book) {
  const path = `books/${book.id}`;
  try {
    await setDoc(doc(db, "books", book.id), book);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fsUpdateBook(id: string, patch: Partial<Book>) {
  const path = `books/${id}`;
  try {
    await updateDoc(doc(db, "books", id), patch);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function fsSaveNotice(notice: Notice) {
  const path = `notices/${notice.id}`;
  try {
    await setDoc(doc(db, "notices", notice.id), notice);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fsSavePost(post: Post) {
  const path = `posts/${post.id}`;
  try {
    await setDoc(doc(db, "posts", post.id), post);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fsSaveVideo(video: Video) {
  const path = `videos/${video.id}`;
  try {
    await setDoc(doc(db, "videos", video.id), video);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fsSaveChallenge(challenge: Challenge) {
  const path = `challenges/${challenge.id}`;
  try {
    await setDoc(doc(db, "challenges", challenge.id), challenge);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fsUpdateChallenge(id: string, patch: Partial<Challenge>) {
  const path = `challenges/${id}`;
  try {
    await updateDoc(doc(db, "challenges", id), patch);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function fsSaveSuggestion(suggestion: Suggestion) {
  const path = `suggestions/${suggestion.id}`;
  try {
    await setDoc(doc(db, "suggestions", suggestion.id), suggestion);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fsUpdateSuggestion(id: string, status: Suggestion["status"]) {
  const path = `suggestions/${id}`;
  try {
    await updateDoc(doc(db, "suggestions", id), { status });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function fsSaveHoliday(entry: HolidayEntry) {
  const path = `holidays/${entry.id}`;
  try {
    await setDoc(doc(db, "holidays", entry.id), entry);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fsDeleteHoliday(id: string) {
  const path = `holidays/${id}`;
  try {
    await deleteDoc(doc(db, "holidays", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function fsUpdateSettings(patch: Partial<Settings>) {
  const path = "settings/habitRules";
  try {
    await updateDoc(doc(db, "settings", "habitRules"), patch);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function fsSaveUser(user: User) {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, "users", user.id), user);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fsUpdateUser(id: string, patch: Partial<User>) {
  const path = `users/${id}`;
  try {
    await updateDoc(doc(db, "users", id), patch);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function fsSaveDepartment(dept: Department) {
  const path = `departments/${dept.id}`;
  try {
    await setDoc(doc(db, "departments", dept.id), dept);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function fsDeleteDepartment(id: string) {
  const path = `departments/${id}`;
  try {
    await deleteDoc(doc(db, "departments", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function fsUpdateReadingLog(id: string, patch: Partial<ReadingLog>) {
  const path = `reading_logs/${id}`;
  try {
    await updateDoc(doc(db, "reading_logs", id), patch);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function fsSaveTakeaway(takeaway: WeeklyTakeaway) {
  const path = `takeaways/${takeaway.id}`;
  try {
    await setDoc(doc(db, "takeaways", takeaway.id), takeaway);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
