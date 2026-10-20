import axios from 'axios';
import mongoose from 'mongoose';
import { Book, IBook } from '../models/Book';
import { UserBook } from '../models/UserBook';
import { env } from '../config/env';
import { NotFoundError, ValidationError } from '../utils/AppError';
import { BookStatus } from '@shared/types';

export interface GoogleBookSearchResult {
  googleBooksId: string;
  title: string;
  author: string;
  totalPages: number;
  language: string;
  coverUrl?: string;
  genre?: string;
}

export class BookService {
  /**
   * PRD Reading-01: Search Google Books API with fallback to local books
   */
  static async searchGoogleBooks(query: string, lang?: string): Promise<GoogleBookSearchResult[]> {
    if (!query || query.trim().length === 0) return [];

    try {
      const apiKey = env.GOOGLE_BOOKS_API_KEY;
      let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`;
      if (apiKey) url += `&key=${apiKey}`;
      if (lang) url += `&langRestrict=${lang}`;

      const response = await axios.get(url, { timeout: 5000 });
      const items = response.data?.items || [];

      return items.map((item: any): GoogleBookSearchResult => {
        const info = item.volumeInfo || {};
        return {
          googleBooksId: item.id,
          title: info.title || 'Untitled',
          author: Array.isArray(info.authors) ? info.authors.join(', ') : 'Unknown Author',
          totalPages: typeof info.pageCount === 'number' && info.pageCount > 0 ? info.pageCount : 100,
          language: info.language || 'en',
          coverUrl: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail,
          genre: Array.isArray(info.categories) && info.categories.length > 0 ? info.categories[0] : undefined
        };
      });
    } catch (err: any) {
      console.warn('Google Books API search failed or timed out, falling back to local DB search:', err.message);
      // Fallback: search local database
      const filter: any = {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { author: { $regex: query, $options: 'i' } }
        ]
      };
      if (lang) filter.language = lang;

      const localBooks = await Book.find(filter).limit(20);
      return localBooks.map(b => ({
        googleBooksId: b.googleBooksId || b.id,
        title: b.title,
        author: b.author,
        totalPages: b.totalPages,
        language: b.language,
        coverUrl: b.coverUrl,
        genre: b.genre
      }));
    }
  }

  /**
   * Find by Google Books ID or create in local database
   */
  static async getOrCreateBook(googleBooksId: string, data?: Partial<IBook>): Promise<IBook> {
    let book = await Book.findOne({ googleBooksId });
    if (book) return book;

    if (data && data.title && data.author) {
      book = await Book.create({
        googleBooksId,
        title: data.title,
        author: data.author,
        totalPages: data.totalPages || 100,
        language: data.language || 'en',
        coverUrl: data.coverUrl,
        genre: data.genre
      });
      return book;
    }

    // Attempt to fetch details from Google Books
    try {
      const apiKey = env.GOOGLE_BOOKS_API_KEY;
      let url = `https://www.googleapis.com/books/v1/volumes/${googleBooksId}`;
      if (apiKey) url += `?key=${apiKey}`;

      const res = await axios.get(url, { timeout: 5000 });
      const info = res.data?.volumeInfo || {};

      book = await Book.create({
        googleBooksId,
        title: info.title || 'Untitled',
        author: Array.isArray(info.authors) ? info.authors.join(', ') : 'Unknown',
        totalPages: typeof info.pageCount === 'number' && info.pageCount > 0 ? info.pageCount : 100,
        language: info.language || 'en',
        coverUrl: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail,
        genre: Array.isArray(info.categories) ? info.categories[0] : undefined
      });
      return book;
    } catch {
      throw new NotFoundError(`Book with ID ${googleBooksId} could not be retrieved`);
    }
  }

  /**
   * Staff/Admin adds a book manually not found on Google Books
   */
  static async createManualBook(
    title: string,
    author: string,
    totalPages: number,
    language: string,
    userId: string,
    genre?: string,
    coverUrl?: string
  ): Promise<IBook> {
    if (!title || !author) throw new ValidationError('Title and author are required');
    if (!totalPages || totalPages <= 0) throw new ValidationError('Total pages must be greater than 0');

    return await Book.create({
      title: title.trim(),
      author: author.trim(),
      totalPages,
      language: language || 'mr',
      genre,
      coverUrl,
      createdBy: new mongoose.Types.ObjectId(userId)
    });
  }

  /**
   * Get book details with reading counts, ratings, and stats
   */
  static async getBookDetail(bookId: string) {
    const book = await Book.findById(bookId);
    if (!book) throw new NotFoundError('Book not found');

    const [readingCount, finishedCount, wantToReadCount, ratingsAgg] = await Promise.all([
      UserBook.countDocuments({ bookId: book._id, status: BookStatus.Reading }),
      UserBook.countDocuments({ bookId: book._id, status: BookStatus.Finished }),
      UserBook.countDocuments({ bookId: book._id, status: BookStatus.WantToRead }),
      UserBook.aggregate([
        { $match: { bookId: book._id, rating: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            ratingsCount: { $sum: 1 }
          }
        }
      ])
    ]);

    const reviews = await UserBook.find({
      bookId: book._id,
      review: { $exists: true, $ne: null, $nin: [''] }
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('userId', 'name')
      .select('rating review updatedAt userId');

    const averageRating = ratingsAgg.length > 0 ? Number(ratingsAgg[0].averageRating.toFixed(1)) : 0;
    const ratingsCount = ratingsAgg.length > 0 ? ratingsAgg[0].ratingsCount : 0;

    return {
      book,
      stats: {
        readingCount,
        finishedCount,
        wantToReadCount,
        averageRating,
        ratingsCount
      },
      reviews
    };
  }

  /**
   * PRD Book-01: Tab 1 — Staff Picks curated by admin
   */
  static async getStaffPicks(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [books, total] = await Promise.all([
      Book.find({ staffPick: true })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Book.countDocuments({ staffPick: true })
    ]);
    return { books, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * PRD Book-01: Tab 4 — Short Reads (under 150 pages)
   */
  static async getShortReads(language?: string, page = 1, limit = 20) {
    const filter: any = { totalPages: { $lte: 150 } };
    if (language) filter.language = language;

    const skip = (page - 1) * limit;
    const [books, total] = await Promise.all([
      Book.find(filter)
        .sort({ totalPages: 1 })
        .skip(skip)
        .limit(limit),
      Book.countDocuments(filter)
    ]);
    return { books, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * PRD Book-01: Tab 3 — Suggested for You (matching genre & language of finished books, excluding shelf)
   */
  static async getSuggestedForYou(userId: string | mongoose.Types.ObjectId, limit = 10) {
    const uId = new mongoose.Types.ObjectId(userId);

    // 1. All books currently on user's shelf
    const shelfEntries = await UserBook.find({ userId: uId }).select('bookId status');
    const shelfBookIds = shelfEntries.map(e => e.bookId);

    // 2. Finished books
    const finishedBookIds = shelfEntries
      .filter(e => e.status === BookStatus.Finished)
      .map(e => e.bookId);

    if (finishedBookIds.length > 0) {
      const finishedBooks = await Book.find({ _id: { $in: finishedBookIds } });
      const genres = Array.from(new Set(finishedBooks.map(b => b.genre).filter(Boolean)));
      const languages = Array.from(new Set(finishedBooks.map(b => b.language).filter(Boolean)));

      const query: any = {
        _id: { $nin: shelfBookIds }
      };

      const conditions: any[] = [];
      if (genres.length > 0) conditions.push({ genre: { $in: genres } });
      if (languages.length > 0) conditions.push({ language: { $in: languages } });

      if (conditions.length > 0) {
        query.$or = conditions;
        const suggestions = await Book.find(query).limit(limit);
        if (suggestions.length > 0) return suggestions;
      }
    }

    // Fallback if no finished books or no genre matches: return staff picks or popular books
    return await Book.find({ _id: { $nin: shelfBookIds } })
      .sort({ staffPick: -1, createdAt: -1 })
      .limit(limit);
  }
}
