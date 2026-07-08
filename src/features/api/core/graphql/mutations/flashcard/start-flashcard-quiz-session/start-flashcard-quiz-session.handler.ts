import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    EntityManager,
} from "typeorm"
import {
    FlashcardQuizSessionEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    UserService,
} from "@modules/bussiness"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    StartFlashcardQuizSessionCommand,
} from "./start-flashcard-quiz-session.command"
import {
    StartFlashcardQuizSessionData,
} from "./graphql-types"

/**
 * Persists ONE resumable flashcard quick-quiz session draw — small enough (an
 * enrollment resolve + an "abandon the prior draw" update + an insert) that,
 * like `SyncMockInterviewSessionTurnsHandler`, it does not warrant a separate
 * domain service; the logic lives directly in the handler.
 */
@CommandHandler(StartFlashcardQuizSessionCommand)
@Injectable()
export class StartFlashcardQuizSessionHandler
    extends ICQRSHandler<StartFlashcardQuizSessionCommand, StartFlashcardQuizSessionData>
    implements ICommandHandler<StartFlashcardQuizSessionCommand, StartFlashcardQuizSessionData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userService: UserService,
    ) {
        super()
    }

    protected override async process(
        command: StartFlashcardQuizSessionCommand,
    ): Promise<StartFlashcardQuizSessionData> {
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

        // resolve/create the trial enrollment ONCE — every downstream lookup
        // (the persisted draw, its future sync/resume/complete calls) is
        // anchored to the SAME enrollment, mirroring
        // `MockInterviewSessionDrawService.draw`'s own resolve step.
        const enrollment = await this.userService.resolveOrCreateTrialEnrollment(
            user.id,
            courseId,
        )

        // retire the enrollment's previous in-flight draw (if any) BEFORE
        // persisting the new one, so resume-lookup never has two candidates —
        // mirrors `MockInterviewSessionDrawService.persistSession`'s own
        // "abandon prior in_progress row" step.
        await this.entityManager.update(
            FlashcardQuizSessionEntity,
            {
                enrollment: {
                    id: enrollment.id,
                },
                status: "in_progress",
            },
            {
                status: "abandoned",
            },
        )

        const session = await this.entityManager.save(
            FlashcardQuizSessionEntity,
            {
                enrollment,
                cardIds,
                currentIndex: 0,
                results: [],
                status: "in_progress",
            },
        )

        return {
            sessionId: session.id,
        }
    }
}
