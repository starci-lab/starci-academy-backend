import {
    Injectable,
} from "@nestjs/common"
import {
    GraphQLError,
} from "graphql"
import {
    EntityManager, In
} from "typeorm"
import {
    ContentEntity
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    FlashcardCardEntity
} from "@modules/databases/postgresql/primary/entities/flashcard-card.entity"
import {
    FlashcardQuizSessionEntity
} from "@modules/databases/postgresql/primary/entities/flashcard-quiz-session.entity"
import {
    XpHistoryEntity
} from "@modules/databases/postgresql/primary/entities/xp-history.entity"
import {
    XpSource
} from "@modules/databases/postgresql/primary/enums/xp-source"
import {
    InjectPrimaryPostgreSQLEntityManager
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CourseRagRetrievalService
} from "@modules/integrations/rag/course-rag-retrieval.service"
import {
    FLAT_POINTS
} from "@features/api/processors/ai/shared/xp/points-config"
import {
    writeXpHistory
} from "@features/api/processors/ai/shared/xp/write-xp-history"
import {
    JOB_READINESS_BUILDING_THRESHOLD
} from "@features/api/core/graphql/queries/users/job-readiness/constants/bands"
import {
    UserFlashcardStatsProjectionService
} from "../projections/user-flashcard-stats/user-flashcard-stats-projection.service"
import {
    FLASHCARD_CLOZE_CONTRACT_VERSION, toPublicQuizItems
} from "./cloze/cloze-contract"
import type {
    ClozeQuizItemSnapshot, ClozeQuizScoreSnapshot, ClozeQuizSelection
} from "./cloze/cloze-contract"
import type {
    ActiveFlashcardQuizSessionResult,
    CompleteFlashcardQuizSessionParams,
    CompleteFlashcardQuizSessionResult,
    QuizSessionAnswerParams,
    QuizSessionWeakTagResult,
    QuizXpSumRow,
    SyncFlashcardQuizSessionParams,
} from "./types/flashcard-quiz-session"

const PER_CARD_XP = 3
const MAX_XP_PER_SESSION = 15
const DAILY_QUIZ_XP_CAP = 60
const DAILY_CAP_TIMEZONE = "Asia/Ho_Chi_Minh"
const MAX_WEAK_TAGS = 5

@Injectable()
/** Owns versioned progress, server grading, completion, and legacy recovery for cloze sessions. */
export class FlashcardQuizSessionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager() private readonly entityManager: EntityManager,
        private readonly userFlashcardStatsProjectionService: UserFlashcardStatsProjectionService,
        private readonly contentRagRetrievalService: CourseRagRetrievalService,
    ) {}

    async sync(params: SyncFlashcardQuizSessionParams): Promise<ActiveFlashcardQuizSessionResult> {
        const { userId, sessionId, currentIndex, expectedVersion, selections } = params
        return this.entityManager.transaction(async (manager) => {
            const session = await this.findOwnedLocked(manager,
                sessionId,
                userId)
            this.assertActiveV1(session)
            const canonical = this.validateSelections(session.quizItems!,
                selections)
            if (expectedVersion !== session.answerVersion) {
                const idempotentRetry = expectedVersion === session.answerVersion - 1
                    && currentIndex === session.currentIndex
                    && JSON.stringify(canonical) === JSON.stringify(session.answerState)
                if (idempotentRetry) return this.toActiveResult(session)
                throw this.error("QUIZ_PROGRESS_STALE",
                    {
                        answerVersion: session.answerVersion,
                        answerState: session.answerState,
                    })
            }
            if (currentIndex < 0 || currentIndex >= session.quizItems!.length) {
                throw this.error("QUIZ_ANSWER_SCOPE_INVALID")
            }
            session.answerState = canonical
            session.currentIndex = currentIndex
            session.answerVersion += 1
            return this.toActiveResult(await manager.save(session))
        })
    }

    async complete(params: CompleteFlashcardQuizSessionParams): Promise<CompleteFlashcardQuizSessionResult> {
        const { userId, sessionId, expectedVersion, selections } = params
        const preview = await this.entityManager.findOne(FlashcardQuizSessionEntity,
            {
                where: {
                    id: sessionId, enrollment: {
                        user: {
                            id: userId
                        }
                    }
                },
                relations: {
                    enrollment: true
                },
            })
        if (!preview) throw this.error("QUIZ_SESSION_NOT_FOUND")
        if (preview.contractVersion !== FLASHCARD_CLOZE_CONTRACT_VERSION || !preview.quizItems) {
            throw this.error("QUIZ_CONTRACT_UNSUPPORTED")
        }
        if (preview.status === "completed" && preview.scoreSnapshot) return this.completedResult(preview)

        const canonical = this.validateSelections(preview.quizItems,
            selections)
        const outcomes = this.grade(preview.quizItems,
            canonical)
        const [weakTags,
            readiness] = await Promise.all([
            this.computeWeakTags(outcomes.answers),
            this.computeReadiness(userId),
        ])

        return this.entityManager.transaction(async (manager) => {
            const session = await this.findOwnedLocked(manager,
                sessionId,
                userId)
            if (session.status === "completed" && session.scoreSnapshot) return this.completedResult(session)
            this.assertActiveV1(session)
            if (expectedVersion !== session.answerVersion) {
                throw this.error("QUIZ_PROGRESS_STALE",
                    {
                        answerVersion: session.answerVersion,
                        answerState: session.answerState,
                    })
            }
            const lockedSelections = this.validateSelections(session.quizItems!,
                selections)
            const score = this.grade(session.quizItems!,
                lockedSelections)
            if (score.totalBlanks <= 0) throw this.error("QUIZ_ZERO_BLANK_SNAPSHOT")
            const courseId = session.enrollment.courseId
            const requestedXp = Math.min(
                MAX_XP_PER_SESSION,
                Math.round(score.coverage * score.answers.length * PER_CARD_XP),
            )
            const grantedToday = await this.sumTodayQuizXp(manager,
                userId,
                courseId)
            const xpEarned = Math.min(requestedXp,
                Math.max(0,
                    DAILY_QUIZ_XP_CAP - grantedToday))
            if (xpEarned > 0) {
                await writeXpHistory({
                    entityManager: manager,
                    userId,
                    courseId,
                    source: XpSource.FlashcardQuiz,
                    amount: xpEarned,
                    points: FLAT_POINTS.flashcardQuizSession,
                    refId: sessionId,
                })
            }
            const scoreSnapshot: ClozeQuizScoreSnapshot = {
                correctBlanks: score.correctBlanks,
                totalBlanks: score.totalBlanks,
                scorePercent: Math.round(score.coverage * 100),
                xpEarned,
                dailyCapReached: xpEarned < requestedXp,
                completedAt: new Date().toISOString(),
                readiness,
            }
            session.answerState = lockedSelections
            session.answerVersion += 1
            session.results = score.answers
            session.coverage = score.coverage
            session.xpEarned = xpEarned
            session.weakTags = weakTags
            session.scoreSnapshot = scoreSnapshot
            session.status = "completed"
            await manager.save(session)
            return {
                sessionId,
                status: "completed",
                answerVersion: session.answerVersion,
                ...scoreSnapshot,
                weakTags,
                readiness,
            }
        })
    }

    async abandonInvalidActiveSession(sessionId: string, userId: string, reason: string): Promise<void> {
        await this.entityManager.transaction(async (manager) => {
            const session = await this.findOwnedLocked(manager,
                sessionId,
                userId)
            if (session.status === "in_progress") {
                session.status = "abandoned"
                session.invalidReason = reason
                await manager.save(session)
            }
        })
    }

    private async findOwnedLocked(manager: EntityManager, sessionId: string, userId: string) {
        const session = await manager.findOne(FlashcardQuizSessionEntity,
            {
                where: {
                    id: sessionId, enrollment: {
                        user: {
                            id: userId
                        }
                    }
                },
                relations: {
                    enrollment: true
                },
                lock: {
                    mode: "pessimistic_write"
                },
            })
        if (!session) throw this.error("QUIZ_SESSION_NOT_FOUND")
        return session
    }

    private assertActiveV1(session: FlashcardQuizSessionEntity): void {
        if (session.contractVersion !== FLASHCARD_CLOZE_CONTRACT_VERSION || !session.quizItems) {
            throw this.error("QUIZ_CONTRACT_UNSUPPORTED")
        }
        if (session.status !== "in_progress") throw this.error("QUIZ_SESSION_NOT_ACTIVE")
    }

    private validateSelections(items: Array<ClozeQuizItemSnapshot>, selections: Array<ClozeQuizSelection>) {
        const blankIds = new Set(items.flatMap((item) => item.blanks.map(({ blankId }) => blankId)))
        const tokenIds = new Set(items.flatMap((item) => item.tokens.map(({ tokenId }) => tokenId)))
        const usedBlanks = new Set<string>()
        const usedTokens = new Set<string>()
        for (const selection of selections) {
            if (!blankIds.has(selection.blankId) || !tokenIds.has(selection.tokenId)
                || usedBlanks.has(selection.blankId) || usedTokens.has(selection.tokenId)) {
                throw this.error("QUIZ_ANSWER_SCOPE_INVALID")
            }
            usedBlanks.add(selection.blankId)
            usedTokens.add(selection.tokenId)
        }
        return [...selections].sort((left, right) => left.blankId.localeCompare(right.blankId))
    }

    private grade(items: Array<ClozeQuizItemSnapshot>, selections: Array<ClozeQuizSelection>) {
        const selected = new Map(selections.map(({ blankId, tokenId }) => [blankId,
            tokenId]))
        let correctBlanks = 0
        let totalBlanks = 0
        const answers = items.map((item): QuizSessionAnswerParams => {
            const itemCorrect = item.blanks.filter(({ blankId }) => {
                totalBlanks += 1
                const correct = selected.get(blankId) === item.answerKey[blankId]
                if (correct) correctBlanks += 1
                return correct
            }).length
            return {
                cardId: item.cardId, correctBlanks: itemCorrect, totalBlanks: item.blanks.length
            }
        })
        return {
            answers, correctBlanks, totalBlanks, coverage: totalBlanks === 0 ? 0 : correctBlanks / totalBlanks
        }
    }

    private toActiveResult(session: FlashcardQuizSessionEntity): ActiveFlashcardQuizSessionResult {
        return {
            sessionId: session.id,
            contractVersion: FLASHCARD_CLOZE_CONTRACT_VERSION,
            items: toPublicQuizItems(session.quizItems!),
            currentIndex: session.currentIndex,
            answerState: session.answerState,
            answerVersion: session.answerVersion,
            status: "in_progress",
        }
    }

    private completedResult(session: FlashcardQuizSessionEntity): CompleteFlashcardQuizSessionResult {
        const score = session.scoreSnapshot!
        return {
            sessionId: session.id,
            status: "completed",
            answerVersion: session.answerVersion,
            correctBlanks: score.correctBlanks,
            totalBlanks: score.totalBlanks,
            scorePercent: score.scorePercent,
            xpEarned: score.xpEarned,
            dailyCapReached: score.dailyCapReached,
            weakTags: session.weakTags ?? [],
            readiness: score.readiness,
        }
    }

    private async sumTodayQuizXp(manager: EntityManager, userId: string, courseId: string): Promise<number> {
        const row = await manager.createQueryBuilder(XpHistoryEntity,
            "history")
            .select("COALESCE(SUM(history.amount), 0)",
                "sum")
            .where("history.user_id = :userId",
                {
                    userId
                })
            .andWhere("history.course_id = :courseId",
                {
                    courseId
                })
            .andWhere("history.source = :source",
                {
                    source: XpSource.FlashcardQuiz
                })
            .andWhere("(history.created_at AT TIME ZONE :timezone)::date = (now() AT TIME ZONE :timezone)::date",
                {
                    timezone: DAILY_CAP_TIMEZONE
                })
            .getRawOne<QuizXpSumRow>()
        return Number(row?.sum) || 0
    }

    private async computeWeakTags(answers: Array<QuizSessionAnswerParams>): Promise<Array<QuizSessionWeakTagResult>> {
        if (answers.length === 0) return []
        const cards = await this.entityManager.find(FlashcardCardEntity,
            {
                where: {
                    id: In(answers.map(({ cardId }) => cardId))
                },
                relations: {
                    deck: true
                },
            })
        const cardById = new Map(cards.map((card) => [card.id,
            card]))
        const sums = new Map<string, { sum: number; count: number; card: FlashcardCardEntity }>()
        for (const answer of answers) {
            const card = cardById.get(answer.cardId)
            if (!card) continue
            for (const tag of card.tags) {
                const value = sums.get(tag) ?? {
                    sum: 0, count: 0, card
                }
                value.sum += answer.totalBlanks <= 0 ? 0 : answer.correctBlanks / answer.totalBlanks
                value.count += 1
                sums.set(tag,
                    value)
            }
        }
        const ranked = [...sums.entries()].map(([tag,
            value]) => ({
            tag, coverage: value.sum / value.count, card: value.card,
        })).sort((left, right) => left.coverage - right.coverage).slice(0,
            MAX_WEAK_TAGS)
        return Promise.all(ranked.map(async ({ tag, coverage, card }) => ({
            tag,
            coverage,
            ...await this.resolveWeakTagLink(card.deck?.courseId,
                tag),
        })))
    }

    private async resolveWeakTagLink(courseId: string | undefined, query: string): Promise<Pick<QuizSessionWeakTagResult, "moduleId" | "contentId">> {
        if (!courseId || !query.trim()) return {
        }
        const { hits } = await this.contentRagRetrievalService.searchCourse({
            courseId, query: query.trim()
        })
        const hit = hits.find((candidate) => candidate.kind === "content" || candidate.kind === "code")
        if (!hit) return {
        }
        const content = await this.entityManager.findOne(ContentEntity,
            {
                where: {
                    id: hit.contentId
                },
                select: {
                    id: true, moduleId: true
                },
            })
        return content ? {
            contentId: content.id, moduleId: content.moduleId
        } : {
        }
    }

    private async computeReadiness(userId: string): Promise<CompleteFlashcardQuizSessionResult["readiness"]> {
        const stats = await this.userFlashcardStatsProjectionService.getStats({
            userId
        })
        return {
            currentAvg: stats.retentionRate,
            threshold: JOB_READINESS_BUILDING_THRESHOLD,
            unlocked: stats.retentionRate >= JOB_READINESS_BUILDING_THRESHOLD,
        }
    }

    private error(code: string, details: Record<string, unknown> = {
    }): GraphQLError {
        return new GraphQLError(code,
            {
                extensions: {
                    code,
                    ...details,
                },
            })
    }
}
