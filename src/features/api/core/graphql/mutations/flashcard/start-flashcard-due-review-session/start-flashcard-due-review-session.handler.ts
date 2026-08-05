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
    StartFlashcardDueReviewSessionCommand,
} from "./start-flashcard-due-review-session.command"
import {
    StartFlashcardDueReviewSessionData,
} from "./graphql-types"

@CommandHandler(StartFlashcardDueReviewSessionCommand)
@Injectable()
/**
 * Persists ONE resumable cross-deck due-review batch session draw --
 * delegates the enrollment resolve + "abandon the prior draw" + insert to
 * {@link FlashcardDueReviewSessionService.start}, which is shared with
 * `myInProgressFlashcardDueReviewSession`'s own resolution.
 */
export class StartFlashcardDueReviewSessionHandler
    extends ICQRSHandler<StartFlashcardDueReviewSessionCommand, StartFlashcardDueReviewSessionData>
    implements ICommandHandler<StartFlashcardDueReviewSessionCommand, StartFlashcardDueReviewSessionData> {
    constructor(
        private readonly flashcardDueReviewSessionService: FlashcardDueReviewSessionService,
    ) {
        super()
    }

    protected override async process(
        command: StartFlashcardDueReviewSessionCommand,
    ): Promise<StartFlashcardDueReviewSessionData> {
        const {
            request: {
                courseId,
                cardIds,
            },
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        return this.flashcardDueReviewSessionService.start({
            userId: user.id,
            courseId,
            cardIds,
        })
    }
}
