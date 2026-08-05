import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    CodingProblemEntity,
} from "@modules/databases/postgresql/primary/entities/coding-problem.entity"
import {
    CodingSolutionRevealEntity,
} from "@modules/databases/postgresql/primary/entities/coding-solution-reveal.entity"
import {
    CodingSubmissionEntity,
} from "@modules/databases/postgresql/primary/entities/coding-submission.entity"
import {
    CodingVerdict,
} from "@modules/databases/postgresql/primary/enums/coding-verdict"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CodingProblemNotFoundException,
} from "@modules/platform/exceptions/errors/coding/coding-problem-not-found"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    EnqueueJudgeCodingSubmissionJobService,
} from "../jobs/enqueue/judge-coding-submission.service"
import {
    DeviceService,
} from "../device/device.service"
import type {
    AcceptedSubmissionSummaryRow,
    AcceptedSubmissionSummaryResult,
    GetAcceptedSubmissionSummaryParams,
    ListMyCodingSubmissionsParams,
    ListMyCodingSubmissionsResult,
    RecordSolutionRevealParams,
    RecordSolutionRevealResult,
    SubmitCodingSolutionParams,
    SubmitCodingSolutionResult,
} from "./types"

/** Default page size for submission history. */
const DEFAULT_PAGE_SIZE = 20

@Injectable()
/**
 * Write-side + history business logic for coding submissions: persist a new
 * submission in `pending` state and enqueue the async judging job, and page a
 * user's submission history for a problem.
 */
export class CodingSubmissionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueJudgeCodingSubmissionJobService: EnqueueJudgeCodingSubmissionJobService,
        private readonly deviceService: DeviceService,
        private readonly winstonService: WinstonService,
    ) {}

    /**
     * Create a pending submission for the problem and enqueue its judging job.
     *
     * @param params - userId, problem slug, language, source
     * @returns the created submission id + the judging job id to subscribe to
     * @throws CodingProblemNotFoundException when the slug is unknown/disabled
     */
    async submit({
        userId,
        slug,
        language,
        sourceCode,
        ipAddress = null,
        userAgent = null,
        fingerprint = null,
    }: SubmitCodingSolutionParams): Promise<SubmitCodingSolutionResult> {
        // resolve the target problem (must exist and be enabled)
        const problem = await this.entityManager.findOne(CodingProblemEntity,
            {
                where: {
                    slug,
                    enabled: true,
                },
            })
        // unknown/disabled slug -> typed not-found
        if (!problem) {
            throw new CodingProblemNotFoundException({
                identifier: slug,
            })
        }
        // persist a fresh submission in the pending state (verdict set later by the worker)
        const submission = await this.entityManager.save(CodingSubmissionEntity,
            {
                user: {
                    id: userId,
                },
                problem: {
                    id: problem.id,
                },
                language,
                sourceCode,
                verdict: CodingVerdict.Pending,
                // request metadata captured for device tracking below
                ipAddress,
                userAgent,
                deviceFingerprint: fingerprint,
            })
        // best-effort: remember the device this submission came from. The
        // submission row already exists at this point, so a failure here
        // must be swallowed (logged, not thrown) -- otherwise it would strand
        // an already-persisted Pending submission with no judging job ever
        // enqueued for it.
        try {
            await this.deviceService.recordDevice({
                userId,
                fingerprint,
                ipAddress,
                userAgent,
            })
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error))
            this.winstonService.log(WinstonLog.BestEffortOperationFailed,
                {
                    op: "coding.device-record.failed",
                    userId,
                    referenceId: submission.id,
                    error: cause.message,
                })
        }
        // enqueue the async judging job; the returned job id is what the client subscribes to
        const job = await this.enqueueJudgeCodingSubmissionJobService.enqueue({
            userId,
            codingSubmissionId: submission.id,
        })
        // hand back both ids so the resolver can return them to the client
        return {
            submissionId: submission.id,
            jobId: job.id,
        }
    }

    /**
     * Record that the user revealed a problem's reference solution. Idempotent
     * (one row per user+problem). Once recorded, a later first solve of that
     * problem awards no points -- peeking the answer forfeits the score.
     *
     * @param params - the viewing user's id + the problem slug
     * @returns whether a new reveal row was created (false when already revealed)
     * @throws CodingProblemNotFoundException when the slug is unknown/disabled
     */
    async recordSolutionReveal({
        userId,
        slug,
    }: RecordSolutionRevealParams): Promise<RecordSolutionRevealResult> {
        // resolve the target problem (must exist + be enabled) and load its reference
        // solutions -- this gated mutation is the ONLY place they are served to the client
        // (the problem detail read never carries them: not a GraphQL field, not indexed).
        const problem = await this.entityManager.findOne(CodingProblemEntity,
            {
                where: {
                    slug,
                    enabled: true,
                },
                relations: {
                    solutions: true,
                },
            })
        if (!problem) {
            throw new CodingProblemNotFoundException({
                identifier: slug,
            })
        }
        const solutions = problem.solutions ?? []
        // already revealed -> idempotent: skip re-recording but still serve the answer
        const existing = await this.entityManager.findOne(CodingSolutionRevealEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                    problem: {
                        id: problem.id,
                    },
                },
            })
        if (existing) {
            return {
                revealed: false,
                solutions,
            }
        }
        // first reveal -> persist the forfeit marker
        await this.entityManager.save(CodingSolutionRevealEntity,
            {
                user: {
                    id: userId,
                },
                problem: {
                    id: problem.id,
                },
            })
        return {
            revealed: true,
            solutions,
        }
    }

    /**
     * Page a user's submissions for one problem, newest first.
     *
     * @param params - userId, slug, pagination
     * @returns the page of submissions + total count
     * @throws CodingProblemNotFoundException when the slug is unknown/disabled
     */
    async listMine({
        userId,
        slug,
        page = 1,
        limit = DEFAULT_PAGE_SIZE,
    }: ListMyCodingSubmissionsParams): Promise<ListMyCodingSubmissionsResult> {
        // resolve the problem id from the slug
        const problem = await this.entityManager.findOne(CodingProblemEntity,
            {
                where: {
                    slug,
                    enabled: true,
                },
            })
        // unknown/disabled slug -> typed not-found
        if (!problem) {
            throw new CodingProblemNotFoundException({
                identifier: slug,
            })
        }
        // page the user's submissions for this problem, newest first
        const [submissions,
            total] = await this.entityManager.findAndCount(
            CodingSubmissionEntity,
            {
                // filter by the RELATION properties, not the read-only @RelationId
                // virtual columns (`userId`/`codingProblemId` aren't queryable and
                // throw EntityPropertyNotFoundError).
                where: {
                    user: {
                        id: userId,
                    },
                    problem: {
                        id: problem.id,
                    },
                },
                order: {
                    createdAt: "DESC",
                },
                skip: (page - 1) * limit,
                take: limit,
            },
        )
        return {
            submissions,
            total,
        }
    }

    /**
     * Read a target user's accepted-submission summary for one problem -- the
     * language(s) used across ALL accepted attempts, plus the testcase counts
     * and first-solve time from the EARLIEST accepted attempt. Backs the
     * public profile's `userCodingProblemDetail` read; deliberately hand-rolled
     * (never returns a raw {@link CodingSubmissionEntity}) so `sourceCode` /
     * `perCaseResults` / reference solutions can never leak through it.
     *
     * @param params - {@link GetAcceptedSubmissionSummaryParams}
     * @returns the summary, or null when the target user has no accepted submission for the problem
     */
    async getAcceptedSummary(
        {
            userId,
            problemId,
        }: GetAcceptedSubmissionSummaryParams,
    ): Promise<AcceptedSubmissionSummaryResult | null> {
        const rows = await this.entityManager.query<Array<AcceptedSubmissionSummaryRow>>(
            `
            WITH accepted AS (
                SELECT language, passed_count, total_count, created_at
                FROM coding_submissions
                WHERE user_id = $1 AND coding_problem_id = $2 AND verdict = 'accepted'
            )
            SELECT
                (SELECT array_agg(DISTINCT language::text) FROM accepted) AS languages,
                (SELECT passed_count FROM accepted ORDER BY created_at ASC LIMIT 1) AS passed_count,
                (SELECT total_count FROM accepted ORDER BY created_at ASC LIMIT 1) AS total_count,
                (SELECT MIN(created_at) FROM accepted) AS first_solved_at
            `,
            [
                userId,
                problemId,
            ],
        )
        const row = rows[0]
        // no accepted attempt for this user+problem -> nothing to show
        if (!row?.first_solved_at) {
            return null
        }
        return {
            languages: row.languages ?? [],
            verdict: CodingVerdict.Accepted,
            passedCount: Number(row.passed_count) || 0,
            totalCount: Number(row.total_count) || 0,
            firstSolvedAt: row.first_solved_at,
        }
    }
}
