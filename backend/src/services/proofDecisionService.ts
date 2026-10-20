import { ProofOutcome } from '@shared/types';
import { Verdict } from './visionService';

export interface DecisionInput {
  verdict: Verdict;
  claimedPage: number;
  lastProvenPage?: number;
  isDuplicatePhoto?: boolean;
  retakeCountToday?: number;
}

export interface DecisionResult {
  outcome: ProofOutcome;
  reason: string;
}

export class ProofDecisionService {
  /**
   * Pure decision function implementing PRD Section 7.5 rules in order
   */
  static decide(input: DecisionInput): DecisionResult {
    const {
      verdict,
      claimedPage,
      lastProvenPage,
      isDuplicatePhoto = false,
      retakeCountToday = 0
    } = input;

    // Rule 1: Exact duplicate photo
    if (isDuplicatePhoto) {
      return {
        outcome: ProofOutcome.Retake,
        reason: 'Duplicate photo detected. Please photograph the physical book page.'
      };
    }

    // Rule 2: Not a book page
    if (!verdict.isBookPage) {
      if (retakeCountToday >= 3) {
        return {
          outcome: ProofOutcome.NeedsReview,
          reason: 'Photo does not appear to be a book page (forwarded to review queue after multiple retakes).'
        };
      }
      return {
        outcome: ProofOutcome.Retake,
        reason: 'The photo does not appear to be an open physical book page.'
      };
    }

    // Rule 3: Text not legible
    if (!verdict.textLegible) {
      if (retakeCountToday >= 3) {
        return {
          outcome: ProofOutcome.NeedsReview,
          reason: 'Text is not clearly legible (forwarded to review queue after multiple retakes).'
        };
      }
      return {
        outcome: ProofOutcome.Retake,
        reason: 'The text on the page is blurry or not legible. Please retake with better lighting.'
      };
    }

    // Rule 4: Photo of a digital screen
    if (verdict.isScreenPhoto) {
      return {
        outcome: ProofOutcome.NeedsReview,
        reason: 'Photo appears to be of a digital screen or monitor.'
      };
    }

    // Rule 5: Confidence below 0.7
    if (verdict.confidence < 0.7) {
      return {
        outcome: ProofOutcome.NeedsReview,
        reason: `AI confidence (${(verdict.confidence * 100).toFixed(0)}%) is below required threshold.`
      };
    }

    // Rule 6: Printed page number differs from claimed page by more than 2
    if (
      verdict.printedPageNumber !== null &&
      verdict.printedPageNumber !== undefined &&
      Math.abs(verdict.printedPageNumber - claimedPage) > 2
    ) {
      return {
        outcome: ProofOutcome.NeedsReview,
        reason: `Visible page number (${verdict.printedPageNumber}) does not match claimed page (${claimedPage}).`
      };
    }

    // Rule 7: Printed page number is not greater than the last proven page for that book
    if (
      verdict.printedPageNumber !== null &&
      verdict.printedPageNumber !== undefined &&
      lastProvenPage !== undefined &&
      verdict.printedPageNumber <= lastProvenPage
    ) {
      return {
        outcome: ProofOutcome.NeedsReview,
        reason: `Visible page number (${verdict.printedPageNumber}) is not greater than last proven page (${lastProvenPage}).`
      };
    }

    // Rule 8: All criteria met -> Accepted
    return {
      outcome: ProofOutcome.Accepted,
      reason: verdict.reason || 'Book page verified successfully.'
    };
  }
}
