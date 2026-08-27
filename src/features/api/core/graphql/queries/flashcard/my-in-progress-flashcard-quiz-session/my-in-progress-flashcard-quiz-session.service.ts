import {
    Injectable
} from "@nestjs/common"
import {
    EntityManager
} from "typeorm"
import {
    FLASHCARD_CLOZE_CONTRACT_VERSION, toPublicQuizItems
} from "@modules/bussiness/flashcard/cloze/cloze-contract"
import {
    FlashcardQuizSessionService
} from "@modules/bussiness/flashcard/flashcard-quiz-session.service"
import {
    FLASHCARD_QUIZ_SESSION_DURATION_MS,
    FlashcardQuizSessionEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-quiz-session.entity"
import {
    InjectPrimaryPostgreSQLEntityManager
} from "@modules/databases/postgresql/primary/primary.decorators"
import type {
    FindMyInProgressFlashcardQuizSessionParams,
    MyInProgressFlashcardQuizSessionResultData,
} from "./types/my-in-progress-flashcard-quiz-session"

@Injectable()
/** Reads one active v1 session and safely abandons legacy, invalid, or expired state. */
export class MyInProgressFlashcardQuizSessionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager() private readonly entityManager: EntityManager,
        private readonly sessionService: FlashcardQuizSessionService,
    ) {}

    async find(params: FindMyInProgressFlashcardQuizSessionParams): Promise<MyInProgressFlashcardQuizSessionResultData | null> {
        const enrollments: Array<{ id: string }> = await this.entityManager.query(
            "SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 ORDER BY created_at DESC LIMIT 1",
            [params.userId,
                params.courseId],
        )
        const enrollment = enrollments[0]
        if (!enrollment) return null
        const session = await this.entityManager.findOne(FlashcardQuizSessionEntity,
            {
                where: {
                    enrollmentId: enrollment.id, status: "in_progress"
                },
                order: {
                    updatedAt: "DESC"
                },
            })
        if (!session) return null
        const totalBlanks = session.quizItems?.reduce((sum, item) => sum + item.blanks.length,
            0) ?? 0
        const expired = session.createdAt.getTime() + FLASHCARD_QUIZ_SESSION_DURATION_MS < Date.now()
        if (session.contractVersion !== FLASHCARD_CLOZE_CONTRACT_VERSION || totalBlanks <= 0 || expired) {
            const reason = expired ? "SESSION_EXPIRED" : "LEGACY_OR_INVALID_SESSION"
            await this.sessionService.abandonInvalidActiveSession(session.id,
                params.userId,
                reason)
            return {
                kind: "RECOVER_TO_SETUP", reason
            }
        }
        return {
            kind: "ACTIVE_V1",
            sessionId: session.id,
            contractVersion: FLASHCARD_CLOZE_CONTRACT_VERSION,
            items: toPublicQuizItems(session.quizItems!),
            currentIndex: session.currentIndex,
            answerState: session.answerState,
            answerVersion: session.answerVersion,
            status: "in_progress",
            updatedAt: session.updatedAt,
            createdAt: session.createdAt,
        }
    }
}
