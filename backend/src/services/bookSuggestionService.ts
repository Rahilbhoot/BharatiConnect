import mongoose from 'mongoose';
import { BookSuggestion, IBookSuggestion } from '../models/BookSuggestion';
import { Book } from '../models/Book';
import { AuditLog } from '../models/AuditLog';
import { SuggestionStatus, Language } from '@shared/types';
import { NotFoundError, ValidationError } from '../utils/AppError';

export class BookSuggestionService {
  /**
   * PRD Book-04: Staff member submits a book suggestion
   */
  static async submitSuggestion(
    userId: string | mongoose.Types.ObjectId,
    title: string,
    author: string,
    reason?: string,
    language: Language = Language.Marathi
  ): Promise<IBookSuggestion> {
    if (!title || !author) throw new ValidationError('Title and author are required');

    return await BookSuggestion.create({
      userId,
      title: title.trim(),
      author: author.trim(),
      reason: reason?.trim(),
      language,
      status: SuggestionStatus.Pending
    });
  }

  /**
   * PRD Book-04: List suggestions (Admin: all, Staff: own)
   */
  static async listSuggestions(
    userId?: string | mongoose.Types.ObjectId,
    status?: SuggestionStatus,
    page = 1,
    limit = 20
  ) {
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [suggestions, total] = await Promise.all([
      BookSuggestion.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email departmentId'),
      BookSuggestion.countDocuments(filter)
    ]);

    return {
      suggestions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * PRD Book-04: Admin reviews suggestion (Approve / Reject) and optionally creates Book
   */
  static async reviewSuggestion(
    suggestionId: string | mongoose.Types.ObjectId,
    status: SuggestionStatus,
    adminId: string,
    createAsStaffPick = false
  ) {
    if (status !== SuggestionStatus.Approved && status !== SuggestionStatus.Rejected) {
      throw new ValidationError('Status must be approved or rejected');
    }

    const suggestion = await BookSuggestion.findById(suggestionId);
    if (!suggestion) throw new NotFoundError('Book suggestion not found');

    const before = suggestion.toObject();

    suggestion.status = status;
    suggestion.reviewedBy = new mongoose.Types.ObjectId(adminId);
    suggestion.reviewedAt = new Date();
    await suggestion.save();

    let createdBook = null;
    if (status === SuggestionStatus.Approved && createAsStaffPick) {
      createdBook = await Book.create({
        title: suggestion.title,
        author: suggestion.author,
        totalPages: 150, // default if manual
        language: suggestion.language,
        staffPick: true,
        createdBy: new mongoose.Types.ObjectId(adminId)
      });
    }

    await AuditLog.create({
      actorId: adminId,
      action: 'REVIEW_BOOK_SUGGESTION',
      targetType: 'BookSuggestion',
      targetId: suggestion._id,
      before,
      after: { ...suggestion.toObject(), createdBookId: createdBook?._id }
    });

    return { suggestion, createdBook };
  }
}
