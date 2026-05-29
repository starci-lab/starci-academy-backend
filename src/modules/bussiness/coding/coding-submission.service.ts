import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    CodingProblemEntity,
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
import type {
    ListMyCodingSubmissionsParams,
    ListMyCodingSubmissionsResult,
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
                where: {
                    userId,
                    codingProblemId: problem.id,
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
