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
    StartFlashcardReviewSessionCommand,
} from "./start-flashcard-review-session.command"
import {
    StartFlashcardReviewSessionData,
} from "./graphql-types"

/**
 * Persists ONE resumable flashcard review ("Học thẻ") session draw over a
 * single deck — delegates the enrollment resolve + "abandon the prior draw"
 * + insert to {@link FlashcardReviewSessionService.start}, which is shared
 * with `myInProgressFlashcardReviewSession`'s own deck-scoped resolution.
 */
@CommandHandler(StartFlashcardReviewSessionCommand)
@Injectable()
export class StartFlashcardReviewSessionHandler
    extends ICQRSHandler<StartFlashcardReviewSessionCommand, StartFlashcardReviewSessionData>
    implements ICommandHandler<StartFlashcardReviewSessionCommand, StartFlashcardReviewSessionData> {
    constructor(
        private readonly flashcardReviewSessionService: FlashcardReviewSessionService,
    ) {
        super()
    }

    protected override async process(
        command: StartFlashcardReviewSessionCommand,
    ): Promise<StartFlashcardReviewSessionData> {
        const {
            request: {
                deckId,
                cardIds,
            },
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        return this.flashcardReviewSessionService.start({
            userId: user.id,
            deckId,
            cardIds,
        })
    }
}
