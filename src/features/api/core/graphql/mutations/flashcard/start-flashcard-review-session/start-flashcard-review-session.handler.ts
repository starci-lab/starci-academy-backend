import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    FlashcardReviewSessionService,
} from "@modules/bussiness/flashcard/flashcard-review-session.service"
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
} from "./graphql-types/response"

@CommandHandler(StartFlashcardReviewSessionCommand)
@Injectable()
/**
 * Persists ONE resumable flashcard review session draw over a
 * single deck -- delegates the enrollment resolve + "abandon the prior draw"
 * + insert to {@link FlashcardReviewSessionService.start}, which is shared
 * with `myInProgressFlashcardReviewSession`'s own deck-scoped resolution.
 */
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
                mode,
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
            mode,
        })
    }
}
