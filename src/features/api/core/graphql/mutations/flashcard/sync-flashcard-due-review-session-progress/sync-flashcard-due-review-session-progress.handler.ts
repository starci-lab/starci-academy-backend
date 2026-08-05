import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    FlashcardDueReviewSessionService,
} from "@modules/bussiness"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    SyncFlashcardDueReviewSessionProgressCommand,
} from "./sync-flashcard-due-review-session-progress.command"
import {
    SyncFlashcardDueReviewSessionProgressData,
} from "./graphql-types"

@CommandHandler(SyncFlashcardDueReviewSessionProgressCommand)
@Injectable()
/**
 * Applies one `syncFlashcardDueReviewSessionProgress` sync -- delegates the
 * ownership-scoped lookup + guard + update to
 * {@link FlashcardDueReviewSessionService.sync}, shared with any other caller
 * that needs the same "silently no-op on a stale/late sync" behavior.
 */
export class SyncFlashcardDueReviewSessionProgressHandler
    extends ICQRSHandler<SyncFlashcardDueReviewSessionProgressCommand, SyncFlashcardDueReviewSessionProgressData>
    implements ICommandHandler<SyncFlashcardDueReviewSessionProgressCommand, SyncFlashcardDueReviewSessionProgressData> {
    constructor(
        private readonly flashcardDueReviewSessionService: FlashcardDueReviewSessionService,
    ) {
        super()
    }

    protected override async process(
        command: SyncFlashcardDueReviewSessionProgressCommand,
    ): Promise<SyncFlashcardDueReviewSessionProgressData> {
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
        // completeFlashcardDueReviewSession, or abandoned by a fresh
        // startFlashcardDueReviewSession draw) -- the service silently no-ops
        // (never throws) rather than surfacing an error toast mid-batch.
        return this.flashcardDueReviewSessionService.sync({
            userId: user.id,
            sessionId,
            currentIndex,
            reviewedCount,
            gradedIndexes,
            xpEarned,
        })
    }
}
