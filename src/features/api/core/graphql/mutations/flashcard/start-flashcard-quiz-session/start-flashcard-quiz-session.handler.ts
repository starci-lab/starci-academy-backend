import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    EntityManager,
} from "typeorm"
import {
    FLASHCARD_QUIZ_SESSION_DURATION_MS,
    FlashcardQuizSessionEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-quiz-session.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
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
} from "./graphql-types/response"

@CommandHandler(StartFlashcardQuizSessionCommand)
@Injectable()
/**
 * Persists ONE resumable flashcard quick-quiz session draw -- small enough (an
 * enrollment resolve + an "abandon the prior draw" update + an insert) that,
 * like `SyncMockInterviewSessionTurnsHandler`, it does not warrant a separate
 * domain service; the logic lives directly in the handler.
 */
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
                mode,
                level,
                name,
            },
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // resolve/create the trial enrollment ONCE -- every downstream lookup
        // (the persisted draw, its future sync/resume/complete calls) is
        // anchored to the SAME enrollment, mirroring
        // `MockInterviewSessionDrawService.draw`'s own resolve step.
        const enrollment = await this.userService.resolveOrCreateTrialEnrollment(
            user.id,
            courseId,
        )

        // retire the enrollment's previous in-flight draw (if any) BEFORE
        // persisting the new one, so resume-lookup never has two candidates --
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
                // request.mode is validated to "quick"|"deep" by @IsIn, but the
                // GraphQL field stays a plain string (mirrors the entity's own
                // reasoning for a plain varchar column) -- narrow it here
                mode: mode as "quick" | "deep",
                level,
                currentIndex: 0,
                results: [],
                status: "in_progress",
                // stored verbatim -- omitted/blank stays null, never
                // server-generated (the FE renders a time-based fallback)
                name: name?.trim() || null,
            },
        )

        return {
            sessionId: session.id,
            deadlineAt: new Date(session.createdAt.getTime() + FLASHCARD_QUIZ_SESSION_DURATION_MS).toISOString(),
        }
    }
}
