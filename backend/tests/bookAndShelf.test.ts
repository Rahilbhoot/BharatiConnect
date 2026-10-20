import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';
import { BookService } from '../src/services/bookService';
import { BookshelfService } from '../src/services/bookshelfService';
import { User } from '../src/models/User';
import { Book } from '../src/models/Book';
import { UserBook } from '../src/models/UserBook';
import { BookStatus, Role } from '@shared/types';
import { ValidationError, ConflictError } from '../src/utils/AppError';

describe('BookService and BookshelfService', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('creates manual book and calculates book stats accurately', async () => {
    const user = await User.create({
      name: 'Book Creator',
      email: 'creator@test.org',
      passwordHash: 'hash',
      role: Role.Staff
    });

    const book = await BookService.createManualBook(
      'Marathi Goshti',
      'P. L. Deshpande',
      120,
      'mr',
      user.id,
      'Fiction'
    );

    expect(book.title).toBe('Marathi Goshti');
    expect(book.totalPages).toBe(120);

    const user2 = await User.create({
      name: 'Book Reader 2',
      email: 'reader2@test.org',
      passwordHash: 'hash',
      role: Role.Staff
    });

    // Add readers
    await UserBook.create([
      { userId: user.id, bookId: book.id, status: BookStatus.Reading, currentPage: 40 },
      { userId: user2.id, bookId: book.id, status: BookStatus.Finished, currentPage: 120, rating: 5, review: 'Excellent!' }
    ]);

    const detail = await BookService.getBookDetail(book.id);
    expect(detail.stats.readingCount).toBe(1);
    expect(detail.stats.finishedCount).toBe(1);
    expect(detail.stats.averageRating).toBe(5);
    expect(detail.reviews).toHaveLength(1);
    expect(detail.reviews[0].review).toBe('Excellent!');
  });

  it('enforces maximum 3 concurrent reading books on shelf (Reading-02)', async () => {
    const user = await User.create({
      name: 'Greedy Reader',
      email: 'greedy@test.org',
      passwordHash: 'hash',
      role: Role.Staff
    });

    const books = await Promise.all([
      Book.create({ title: 'Book 1', author: 'A1', totalPages: 100, language: 'en' }),
      Book.create({ title: 'Book 2', author: 'A2', totalPages: 100, language: 'en' }),
      Book.create({ title: 'Book 3', author: 'A3', totalPages: 100, language: 'en' }),
      Book.create({ title: 'Book 4', author: 'A4', totalPages: 100, language: 'en' })
    ]);

    // Add 3 books to reading status
    await BookshelfService.addToShelf(user.id, books[0].id, BookStatus.Reading);
    await BookshelfService.addToShelf(user.id, books[1].id, BookStatus.Reading);
    await BookshelfService.addToShelf(user.id, books[2].id, BookStatus.Reading);

    // 4th book in reading status should be rejected
    await expect(
      BookshelfService.addToShelf(user.id, books[3].id, BookStatus.Reading)
    ).rejects.toThrow(ValidationError);
  });

  it('awards 100 points when moving a book status to finished', async () => {
    const user = await User.create({
      name: 'Completer',
      email: 'completer@test.org',
      passwordHash: 'hash',
      role: Role.Staff,
      points: 0
    });

    const book = await Book.create({
      title: 'Finish Me',
      author: 'Author',
      totalPages: 100,
      language: 'en'
    });

    await BookshelfService.addToShelf(user.id, book.id, BookStatus.Reading);
    await BookshelfService.updateShelfStatus(user.id, book.id, BookStatus.Finished);

    const updatedUser = await User.findById(user.id);
    expect(updatedUser?.points).toBe(100);
    expect(updatedUser?.level).toBe('page_turner');
  });

  it('suggests books matching language and genre of finished books excluding shelf (Book-01)', async () => {
    const user = await User.create({
      name: 'Taste Reader',
      email: 'taste@test.org',
      passwordHash: 'hash',
      role: Role.Staff
    });

    // User finished a Marathi History book
    const finishedBook = await Book.create({
      title: 'Shivaji Maharaj',
      author: 'Babasaheb Purandare',
      totalPages: 250,
      language: 'mr',
      genre: 'History'
    });

    await UserBook.create({
      userId: user.id,
      bookId: finishedBook.id,
      status: BookStatus.Finished,
      currentPage: 250
    });

    // Candidate books
    const matchingBook = await Book.create({
      title: 'Maratha Empire',
      author: 'Historian',
      totalPages: 200,
      language: 'mr',
      genre: 'History'
    });

    const unrelatedBook = await Book.create({
      title: 'French Cooking',
      author: 'Chef',
      totalPages: 180,
      language: 'fr',
      genre: 'Cooking'
    });

    const suggestions = await BookService.getSuggestedForYou(user.id);
    const suggestedIds = suggestions.map(s => s._id.toString());

    expect(suggestedIds).toContain(matchingBook.id.toString());
    expect(suggestedIds).not.toContain(finishedBook.id.toString()); // excluded from shelf
  });
});
