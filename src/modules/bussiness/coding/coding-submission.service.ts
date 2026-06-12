import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    CodingProblemEntity,
    CodingSolutionRevealEntity,
    CodingSubmissionEntity,
    CodingVerdict,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    CodingProblemNotFoundException,
} from "@modules/exceptions"
import {
    EnqueueJudgeCodingSubmissionJobService,
} from "../jobs"
import {
    AntiCheatService,
} from "../anti-cheat"
import {
    DeviceService,
} from "../device"
import type {
    ListMyCodingSubmissionsParams,
    ListMyCodingSubmissionsResult,
    RecordSolutionRevealResult,
    SubmitCodingSolutionParams,
    SubmitCodingSolutionResult,
} from "./types"

/** Default page size for submission history. */
const DEFAULT_PAGE_SIZE = 20

/**
 * Write-side + history business logic for coding submissions: persist a new
 * submission in `pending` state and enqueue the async judging job, and page a
 * user's submission history for a problem.
 */
@Injectable()
export class CodingSubmissionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly enqueueJudgeCodingSubmissionJobService: EnqueueJudgeCodingSubmissionJobService,
        private readonly antiCheatService: AntiCheatService,
        private readonly deviceService: DeviceService,
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
        telemetry,
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
        // unknown/disabled slug → typed not-found
        if (!problem) {
            throw new CodingProblemNotFoundException({
                identifier: slug,
            })
        }
        // score the attempt for AI/paste-cheat likelihood (never blocks submit)
        const evaluation = this.antiCheatService.evaluate({
            telemetry,
            codeLength: sourceCode.length,
        })
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
                // anti-cheat capture: request metadata + telemetry + verdict
                ipAddress,
                userAgent,
                deviceFingerprint: fingerprint,
                // store raw telemetry + computed reasons for later review
                clientTelemetry: telemetry
                    ? JSON.stringify({
                        ...telemetry,
                        reasons: evaluation.reasons,
                    })
                    : null,
                suspicionScore: evaluation.suspicionScore,
                flaggedForReview: evaluation.flagged,
            })
        // best-effort: remember the device this submission came from
        await this.deviceService.recordDevice({
            userId,
            fingerprint,
            ipAddress,
            userAgent,
        })
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
     * problem awards no points — peeking the answer forfeits the score.
     *
     * @param params - the viewing user's id + the problem slug
     * @returns whether a new reveal row was created (false when already revealed)
     * @throws CodingProblemNotFoundException when the slug is unknown/disabled
     */
    async recordSolutionReveal({
        userId,
        slug,
    }: {
        /** The viewing user's id. */
        userId: string
        /** Slug of the problem whose solution was revealed. */
        slug: string
    }): Promise<RecordSolutionRevealResult> {
        // resolve the target problem (must exist + be enabled) and load its reference
        // solutions — this gated mutation is the ONLY place they are served to the client
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
        // already revealed → idempotent: skip re-recording but still serve the answer
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
        // first reveal → persist the forfeit marker
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
        // unknown/disabled slug → typed not-found
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
}
