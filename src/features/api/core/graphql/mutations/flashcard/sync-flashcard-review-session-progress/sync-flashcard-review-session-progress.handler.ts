import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    FlashcardReviewSessionService,
} from "@modules/bussiness"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    SyncFlashcardReviewSessionProgressCommand,
} from "./sync-flashcard-review-session-progress.command"
import {
    SyncFlashcardReviewSessionProgressData,
} from "./graphql-types"

@CommandHandler(SyncFlashcardReviewSessionProgressCommand)
@Injectable()
/**
 * Applies one `syncFlashcardReviewSessionProgress` sync — delegates the
 * ownership-scoped lookup + guard + update to
 * {@link FlashcardReviewSessionService.sync}, shared with any other caller
 * that needs the same "silently no-op on a stale/late sync" behavior.
 */
export class SyncFlashcardReviewSessionProgressHandler
    extends ICQRSHandler<SyncFlashcardReviewSessionProgressCommand, SyncFlashcardReviewSessionProgressData>
    implements ICommandHandler<SyncFlashcardReviewSessionProgressCommand, SyncFlashcardReviewSessionProgressData> {
    constructor(
        private readonly flashcardReviewSessionService: FlashcardReviewSessionService,
    ) {
        super()
    }

    protected override async process(
        command: SyncFlashcardReviewSessionProgressCommand,
    ): Promise<SyncFlashcardReviewSessionProgressData> {
        const {
            request: {
                sessionId,
                currentIndex,
                reviewedCount,
                gradedIndexes,
                xpEarned,
            },
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // not found/not owned, or no longer resumable (already completed by
        // completeFlashcardReviewSession, or abandoned by a fresh
        // startFlashcardReviewSession draw) — the service silently no-ops
        // (never throws) rather than surfacing an error toast mid-review.
        return this.flashcardReviewSessionService.sync({
            userId: user.id,
            sessionId,
            currentIndex,
            reviewedCount,
            gradedIndexes,
            xpEarned,
        })
    }
}
