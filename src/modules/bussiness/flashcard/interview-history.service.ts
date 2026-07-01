import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    IsNull,
    Not,
} from "typeorm"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    InterviewAttemptEntity,
} from "@modules/databases"
import {
    InterviewVerdict,
} from "./types/interview-grade"
import type {
    GetInterviewHistoryParams,
    GetInterviewSessionAttemptsParams,
    GetInterviewSessionsParams,
    InterviewHistorySummary,
    InterviewSessionAttempt,
    InterviewSessionSummary,
    InterviewSessionsPage,
} from "./types/interview-history"

/** How many recent attempts to aggregate (bounds the per-request scan). */
const HISTORY_WINDOW = 200

/** How many recent attempts to scan when grouping into runs (bounds the session list). */
const SESSIONS_SCAN_WINDOW = 1000

/** How many weak topics to surface in the summary. */
const MAX_WEAK_TAGS = 6

/**
 * Reads + aggregates a user's mock-interview history from the append-only
 * `interview_attempts` log: average score, verdict breakdown, and the weakest
 * topics (tags of the answers not passed). Computed in TS from a bounded recent
 * window — interview practice is low-volume per user, so no projection is needed.
 */
@Injectable()
export class InterviewHistoryService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Aggregate the viewer's recent interview attempts into a history summary.
     *
     * @param params - Viewer id + optional deck scope.
     * @returns The aggregated summary (zeroed when the user has no attempts).
     */
    async getSummary(
        {
            userId,
            flashcardDeckId,
            courseId,
        }: GetInterviewHistoryParams,
    ): Promise<InterviewHistorySummary> {
        // Build the scope. The course-wide (random-interview) branch is keyed by
        // ENROLLMENT id (the anchor for per-course progress going forward) — an
        // enrollment IS user × course, so filtering by enrollment_id is inherently
        // course-scoped, and interview_attempts.enrollment_id is backfilled. The
        // enrollment is resolved READ-ONLY (no trial create on a read). The legacy
        // single-deck and account-wide branches stay keyed by user_id (no single
        // course / enrollment to anchor on).
        const scope: Record<string, unknown> = {
        }
        if (flashcardDeckId) {
            // one deck (legacy) takes precedence — scope by deck + the viewer (user_id)
            scope.userId = userId
            scope.flashcardDeckId = flashcardDeckId
        } else if (courseId) {
            const enrollment = await this.entityManager.findOne(
                EnrollmentEntity,
                {
                    where: {
                        user: {
                            id: userId,
                        },
                        course: {
                            id: courseId,
                        },
                    },
                    select: {
                        id: true,
                    },
                },
            )
            // no enrollment for this user × course → no attempts in scope; zeroed summary
            if (!enrollment) {
                return {
                    totalAnswered: 0,
                    averageScore: 0,
                    bestScore: 0,
                    passCount: 0,
                    borderlineCount: 0,
                    failCount: 0,
                    weakTags: [],
                    lastAttemptAt: null,
                }
            }
            // key by the enrollment relation (enrollmentId is a @RelationId virtual
            // prop, not a column → filter via the relation: { enrollment: { id } })
            scope.enrollment = {
                id: enrollment.id,
            }
        } else {
            // account-wide → every attempt the viewer owns (user_id)
            scope.userId = userId
        }

        // newest-first window, scoped to the resolved set (deck+user / enrollment / user)
        const attempts = await this.entityManager.find(
            InterviewAttemptEntity,
            {
                where: scope,
                order: {
                    createdAt: "DESC",
                },
                take: HISTORY_WINDOW,
            },
        )

        const totalAnswered = attempts.length
        if (totalAnswered === 0) {
            return {
                totalAnswered: 0,
                averageScore: 0,
                bestScore: 0,
                passCount: 0,
                borderlineCount: 0,
                failCount: 0,
                weakTags: [],
                lastAttemptAt: null,
            }
        }

        const scoreSum = attempts.reduce((sum, attempt) => sum + attempt.score,
            0)
        const averageScore = Math.round((scoreSum / totalAnswered) * 10) / 10
        const bestScore = attempts.reduce((max, attempt) => Math.max(max,
            attempt.score),
        0)
        const passCount = attempts.filter(
            (attempt) => attempt.verdict === InterviewVerdict.Pass,
        ).length
        const borderlineCount = attempts.filter(
            (attempt) => attempt.verdict === InterviewVerdict.Borderline,
        ).length
        const failCount = attempts.filter(
            (attempt) => attempt.verdict === InterviewVerdict.Fail,
        ).length

        // weakest topics: tag frequency across the attempts NOT passed
        const weakTagCounts = new Map<string, number>()
        for (const attempt of attempts) {
            if (attempt.verdict !== InterviewVerdict.Pass) {
                for (const tag of attempt.tags ?? []) {
                    weakTagCounts.set(tag,
                        (weakTagCounts.get(tag) ?? 0) + 1)
                }
            }
        }
        const weakTags = [...weakTagCounts.entries()]
            .sort((left, right) => right[1] - left[1])
            .slice(0,
                MAX_WEAK_TAGS)
            .map(([tag]) => tag)

        return {
            totalAnswered,
            averageScore,
            bestScore,
            passCount,
            borderlineCount,
            failCount,
            weakTags,
            // attempts are newest-first, so the head is the most recent
            lastAttemptAt: attempts[0].createdAt,
        }
    }

    /**
     * List the viewer's interview RUNS (sessions), newest first, paginated.
     * Groups the `interview_attempts` rows that share an `interview_session_id`
     * into one summary per run (question count, average/best score, verdict
     * breakdown, dominant level). Legacy rows without a session id are skipped —
     * they predate run grouping. Aggregation is computed in TS from a bounded
     * window (interview practice is low-volume per user).
     *
     * @param params - Viewer id + optional scope + page window.
     * @returns A page of run summaries plus the total run count.
     */
    async getSessions(
        {
            userId,
            flashcardDeckId,
            courseId,
            limit,
            offset,
        }: GetInterviewSessionsParams,
    ): Promise<InterviewSessionsPage> {
        const scope = await this.resolveScope({
            userId,
            flashcardDeckId,
            courseId,
        })
        // course scope with no enrollment → nothing in scope
        if (!scope) {
            return {
                items: [],
                totalCount: 0,
            }
        }

        // only rows that belong to a run (session id set) can be grouped
        const attempts = await this.entityManager.find(
            InterviewAttemptEntity,
            {
                where: {
                    ...scope,
                    interviewSessionId: Not(IsNull()),
                },
                order: {
                    createdAt: "DESC",
                },
                take: SESSIONS_SCAN_WINDOW,
            },
        )

        // group attempts into runs by their shared session id
        const runs = new Map<string, Array<InterviewAttemptEntity>>()
        for (const attempt of attempts) {
            const sessionId = attempt.interviewSessionId
            if (!sessionId) {
                continue
            }
            const bucket = runs.get(sessionId)
            if (bucket) {
                bucket.push(attempt)
            } else {
                runs.set(sessionId,
                    [
                        attempt,
                    ])
            }
        }

        // summarize each run, then sort newest-first by when the run started
        const summaries: Array<InterviewSessionSummary> = [...runs.entries()]
            .map(([sessionId,
                rows]) => this.summarizeRun(sessionId,
                rows))
            .sort((left, right) => right.startedAt.getTime() - left.startedAt.getTime())

        return {
            totalCount: summaries.length,
            items: summaries.slice(offset,
                offset + limit),
        }
    }

    /**
     * List the answered questions of ONE run (session), in answer order, each
     * with its grade + persisted feedback (strengths/gaps/hint) and the question
     * prompt (joined from the card). Legacy rows have empty feedback.
     *
     * @param params - Viewer id + scope + the run's session id.
     * @returns The run's attempts (empty when out of scope / not found).
     */
    async getSessionAttempts(
        {
            userId,
            flashcardDeckId,
            courseId,
            sessionId,
        }: GetInterviewSessionAttemptsParams,
    ): Promise<Array<InterviewSessionAttempt>> {
        const scope = await this.resolveScope({
            userId,
            flashcardDeckId,
            courseId,
        })
        if (!scope) {
            return []
        }

        const attempts = await this.entityManager.find(
            InterviewAttemptEntity,
            {
                where: {
                    ...scope,
                    interviewSessionId: sessionId,
                },
                // the card carries the question prompt to echo in the detail
                relations: {
                    flashcardCard: true,
                },
                order: {
                    createdAt: "ASC",
                },
            },
        )

        return attempts.map((attempt) => ({
            id: attempt.id,
            score: attempt.score,
            verdict: attempt.verdict,
            level: attempt.level,
            tags: attempt.tags ?? [],
            question: attempt.flashcardCard?.question ?? "",
            strengths: attempt.strengths ?? [],
            gaps: attempt.gaps ?? [],
            modelAnswerHint: attempt.modelAnswerHint ?? null,
            createdAt: attempt.createdAt,
        }))
    }

    /**
     * Resolve the WHERE scope for a history read (deck / course / account-wide),
     * mirroring {@link getSummary}. Returns null only for a course scope whose
     * user has no enrollment (so callers can short-circuit to an empty result).
     *
     * @param params - Viewer id + optional deck/course scope.
     * @returns The TypeORM where-scope, or null when a course has no enrollment.
     */
    private async resolveScope(
        {
            userId,
            flashcardDeckId,
            courseId,
        }: GetInterviewHistoryParams,
    ): Promise<Record<string, unknown> | null> {
        if (flashcardDeckId) {
            return {
                userId,
                flashcardDeckId,
            }
        }
        if (courseId) {
            const enrollment = await this.entityManager.findOne(
                EnrollmentEntity,
                {
                    where: {
                        user: {
                            id: userId,
                        },
                        course: {
                            id: courseId,
                        },
                    },
                    select: {
                        id: true,
                    },
                },
            )
            if (!enrollment) {
                return null
            }
            // filter via the relation — enrollmentId is a @RelationId virtual prop,
            // not a queryable column
            return {
                enrollment: {
                    id: enrollment.id,
                },
            }
        }
        return {
            userId,
        }
    }

    /**
     * Reduce one run's attempt rows into an {@link InterviewSessionSummary}.
     *
     * @param sessionId - The shared session id of the run.
     * @param rows - The run's attempt rows (non-empty).
     * @returns The aggregated run summary.
     */
    private summarizeRun(
        sessionId: string,
        rows: Array<InterviewAttemptEntity>,
    ): InterviewSessionSummary {
        const questionCount = rows.length
        const scoreSum = rows.reduce((sum, row) => sum + row.score,
            0)
        const averageScore = Math.round((scoreSum / questionCount) * 10) / 10
        const bestScore = rows.reduce((max, row) => Math.max(max,
            row.score),
        0)
        const passCount = rows.filter(
            (row) => row.verdict === InterviewVerdict.Pass,
        ).length
        const borderlineCount = rows.filter(
            (row) => row.verdict === InterviewVerdict.Borderline,
        ).length
        const failCount = rows.filter(
            (row) => row.verdict === InterviewVerdict.Fail,
        ).length

        // dominant seniority level across the run's questions (mode), or null
        const levelCounts = new Map<string, number>()
        for (const row of rows) {
            if (row.level) {
                levelCounts.set(row.level,
                    (levelCounts.get(row.level) ?? 0) + 1)
            }
        }
        const level = [...levelCounts.entries()]
            .sort((left, right) => right[1] - left[1])
            .map(([value]) => value)[0] ?? null

        // the run started at its earliest attempt
        const startedAt = rows.reduce(
            (earliest, row) => (row.createdAt < earliest
                ? row.createdAt
                : earliest),
            rows[0].createdAt,
        )

        return {
            sessionId,
            startedAt,
            questionCount,
            averageScore,
            bestScore,
            passCount,
            borderlineCount,
            failCount,
            level,
        }
    }
}
