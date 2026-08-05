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
    FlashcardQuizSessionResult,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    SyncFlashcardQuizSessionProgressCommand,
} from "./sync-flashcard-quiz-session-progress.command"
import {
    SyncFlashcardQuizSessionProgressData,
} from "./graphql-types"

@CommandHandler(SyncFlashcardQuizSessionProgressCommand)
@Injectable()
/**
 * Applies one `syncFlashcardQuizSessionProgress` sync -- small enough (a
 * single ownership-scoped lookup + guard + update) that, like
 * `SyncMockInterviewSessionTurnsHandler`, it does not warrant a separate
 * domain service; the logic lives directly in the handler.
 */
export class SyncFlashcardQuizSessionProgressHandler
    extends ICQRSHandler<SyncFlashcardQuizSessionProgressCommand, SyncFlashcardQuizSessionProgressData>
    implements ICommandHandler<SyncFlashcardQuizSessionProgressCommand, SyncFlashcardQuizSessionProgressData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        command: SyncFlashcardQuizSessionProgressCommand,
    ): Promise<SyncFlashcardQuizSessionProgressData> {
        const {
            request: {
                sessionId,
                currentIndex,
                results,
            },
            user,
        } = command.params

        if (!user) {
            throw new UserNotFoundException({
            })
        }

        // ownership check mirrors `SyncMockInterviewSessionTurnsHandler` -- a
        // session can never be synced on behalf of a different learner's
        // draw. Scoped through the relation (`enrollment: { user: { id } }`),
        // NOT the virtual `enrollment.userId` @RelationId column, which
        // TypeORM cannot filter on directly.
        const session = await this.entityManager.findOne(
            FlashcardQuizSessionEntity,
            {
                where: {
                    id: sessionId,
                    enrollment: {
                        user: {
                            id: user.id,
                        },
                    },
                },
                select: {
                    id: true,
                    status: true,
                },
            },
        )

        // not found/not owned, or no longer resumable (already completed by
        // completeFlashcardQuizSession, or abandoned by a fresh
        // startFlashcardQuizSession draw) -- a late/stale sync must silently
        // no-op rather than throw, so a background periodic sync never
        // surfaces an error toast mid-quiz.
        if (!session || session.status !== "in_progress") {
            return {
                success: false,
            }
        }

        await this.entityManager.update(
            FlashcardQuizSessionEntity,
            {
                id: session.id,
            },
            {
                currentIndex,
                results: results.map((result): FlashcardQuizSessionResult => ({
                    cardId: result.cardId,
                    correctBlanks: result.correctBlanks,
                    totalBlanks: result.totalBlanks,
                })),
            },
        )

        return {
            success: true,
        }
    }
}
