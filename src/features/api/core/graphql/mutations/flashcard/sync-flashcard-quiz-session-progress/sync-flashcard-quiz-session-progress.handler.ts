import {
    Injectable
} from "@nestjs/common"
import {
    CommandHandler, ICommandHandler
} from "@nestjs/cqrs"
import {
    FlashcardQuizSessionService
} from "@modules/bussiness/flashcard/flashcard-quiz-session.service"
import {
    ICQRSHandler
} from "@modules/platform/cqrs/icqrs-handler"
import {
    UserNotFoundException
} from "@modules/platform/exceptions/errors/users/user"
import {
    SyncFlashcardQuizSessionProgressCommand
} from "./sync-flashcard-quiz-session-progress.command"
import {
    SyncFlashcardQuizSessionProgressData
} from "./graphql-types/response"

@CommandHandler(SyncFlashcardQuizSessionProgressCommand)
@Injectable()
/** Delegates an authenticated versioned progress replacement to the session authority. */
export class SyncFlashcardQuizSessionProgressHandler
    extends ICQRSHandler<SyncFlashcardQuizSessionProgressCommand, SyncFlashcardQuizSessionProgressData>
    implements ICommandHandler<SyncFlashcardQuizSessionProgressCommand, SyncFlashcardQuizSessionProgressData> {
    constructor(private readonly sessionService: FlashcardQuizSessionService) { super() }

    protected override async process(command: SyncFlashcardQuizSessionProgressCommand) {
        const { request, user } = command.params
        if (!user) throw new UserNotFoundException({
        })
        return this.sessionService.sync({
            userId: user.id,
            sessionId: request.sessionId,
            currentIndex: request.currentIndex,
            expectedVersion: request.expectedVersion,
            selections: request.selections,
        })
    }
}
