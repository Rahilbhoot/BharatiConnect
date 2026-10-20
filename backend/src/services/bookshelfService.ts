import mongoose from 'mongoose';
import { UserBook, IUserBook } from '../models/UserBook';
import { Book } from '../models/Book';
import { PointsService } from './pointsService';
import { BookStatus } from '@shared/types';
import { NotFoundError, ValidationError, ConflictError } from '../utils/AppError';

export class BookshelfService {
  /**
   * PRD Reading-02: Add book to shelf with status (want_to_read, reading, finished)
   * Enforces max 3 books in 'reading' status
   */
  static async addToShelf(
    userId: string | mongoose.Types.ObjectId,
    bookId: string | mongoose.Types.ObjectId,
    status: BookStatus = BookStatus.WantToRead
  ): Promise<IUserBook> {
    const book = await Book.findById(bookId);
    if (!book) throw new NotFoundError('Book not found');

    const existing = await UserBook.findOne({ userId, bookId });
    if (existing) {
      throw new ConflictError('Book is already on your shelf');
    }

    if (status === BookStatus.Reading) {
      const readingCount = await UserBook.countDocuments({ userId, status: BookStatus.Reading });
      if (readingCount >= 3) {
        throw new ValidationError('You can only have up to 3 books in reading status at a time');
      }
    }

    const userBook = await UserBook.create({
      userId,
      bookId,
      status,
      currentPage: 0,
      startedAt: status === BookStatus.Reading ? new Date() : undefined,
      finishedAt: status === BookStatus.Finished ? new Date() : undefined
    });

    if (status === BookStatus.Finished) {
      await PointsService.awardPoints(userId, 100, 'book_finished', String(bookId), 'Book');
    }

    return userBook;
  }

  /**
   * PRD Reading-02, Reading-09: Update book status on shelf
   */
  static async updateShelfStatus(
    userId: string | mongoose.Types.ObjectId,
    bookId: string | mongoose.Types.ObjectId,
    status: BookStatus
  ): Promise<IUserBook> {
    const userBook = await UserBook.findOne({ userId, bookId });
    if (!userBook) throw new NotFoundError('Book not found in your shelf');

    if (status === BookStatus.Reading && userBook.status !== BookStatus.Reading) {
      const readingCount = await UserBook.countDocuments({ userId, status: BookStatus.Reading });
      if (readingCount >= 3) {
        throw new ValidationError('You can only have up to 3 books in reading status at a time');
      }
      if (!userBook.startedAt) userBook.startedAt = new Date();
    }

    if (status === BookStatus.Finished && userBook.status !== BookStatus.Finished) {
      userBook.finishedAt = new Date();
      const book = await Book.findById(bookId);
      if (book) {
        userBook.currentPage = book.totalPages;
      }
      await PointsService.awardPoints(userId, 100, 'book_finished', String(bookId), 'Book');
    }

    userBook.status = status;
    await userBook.save();
    return userBook;
  }

  /**
   * PRD Reading-02: Get all books on user's shelf with optional status filter
   */
  static async getShelf(
    userId: string | mongoose.Types.ObjectId,
    status?: BookStatus
  ) {
    const filter: any = { userId };
    if (status) filter.status = status;

    return await UserBook.find(filter)
      .sort({ updatedAt: -1 })
      .populate('bookId', 'title author totalPages language coverUrl genre staffPick');
  }

  /**
   * PRD Book-05: Rate and review finished book (1 to 5, one-line review)
   */
  static async rateBook(
    userId: string | mongoose.Types.ObjectId,
    bookId: string | mongoose.Types.ObjectId,
    rating: number,
    review?: string
  ): Promise<IUserBook> {
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be a number between 1 and 5');
    }
    if (review && review.length > 280) {
      throw new ValidationError('Review cannot exceed 280 characters');
    }

    const userBook = await UserBook.findOne({ userId, bookId });
    if (!userBook) throw new NotFoundError('Book not found in your shelf');

    userBook.rating = rating;
    if (review) userBook.review = review.trim();
    await userBook.save();

    return userBook;
  }
}
