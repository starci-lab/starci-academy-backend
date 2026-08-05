import type {
    GenerateCvPayload,
} from "@modules/bullmq"
import {
    JobActionService,
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    CvGenerationMode,
    CvSource,
    InjectPrimaryPostgreSQLEntityManager,
    UserCvGenerationEntity,
    UserEntity,
    UserXpProjectionEntity,
} from "@modules/databases"
import {
    S3Provider,
    S3ReadService,
} from "@modules/s3"
import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import type {
    ExtendedGenerateCvContext,
    GatheredChallengeSubmission,
    GatheredCodingSolve,
    GatheredMilestoneTaskAttempt,
    GatheredUserProfile,
    GatheredXpBreakdown,
    GenerateCvGatherStepExecuteResult,
} from "../types"
import {
    extractCvText,
} from "./extract-cv-text"

/** Row shape returned by the PASSED milestone-task-attempts SQL. */
interface MilestoneTaskAttemptRow {
    task_title: string
    milestone_title: string
    course_title: string
    score: number
}

/** Row shape returned by the graded challenge-submissions SQL. */
interface ChallengeSubmissionRow {
    challenge_title: string
    course_title: string
    score: number
    submission_url: string | null
    selected_lang: string | null
}

/** Row shape returned by the accepted coding-solves SQL. */
interface CodingSolveRow {
    problem_title: string
    difficulty: string
    domain: string
}

/**
 * XP jsonb `value` shape stored on `user_xp_projections` (per-source SUM(amount)).
 */
interface XpProjectionValue {
    challengeXp?: number
    milestoneXp?: number
    codingXp?: number
    lessonXp?: number
}

@Injectable()
/**
 * Step 0 -- gather. Assembles EVERY verified achievement + profile the learner has
 * earned (milestone/capstone passes, graded challenge submissions, accepted coding
 * solves, profile fields, per-source XP) by querying the live tables DIRECTLY via
 * the {@link EntityManager} (this runs in a background job -- no GraphQL). In
 * `Revise` mode it also buffers the uploaded source CV from MinIO and extracts its
 * text (pdf/docx) so the compose step can rewrite it. The whole gathered blob is
 * persisted as this step's execution result for the compose step to read.
 */
export class GenerateCvGatherStepService extends AbstractStepService<
    GenerateCvPayload,
    ExtendedGenerateCvContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly s3ReadService: S3ReadService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "gather"

    /**
     * Process the gather step.
     */
    async process(
        context: JobExtendedContext<
            GenerateCvPayload,
            ExtendedGenerateCvContext
        >,
    ): Promise<void> {
        try {
            const executionResult = await this.execute(context)
            await this.finalize(executionResult,
                context)
        } catch (error) {
            await this.jobActionService.failJob(
                {
                    job: context.job,
                    error: error.message,
                },
            )
            throw error
        }
    }

    /**
     * Execute: query all verified sources concurrently, then (Revise) extract the
     * uploaded source CV text.
     */
    private async execute(
        context: JobExtendedContext<
            GenerateCvPayload,
            ExtendedGenerateCvContext
        >,
    ): Promise<GenerateCvGatherStepExecuteResult> {
        const { payload } = context
        const { userId } = payload

        // all reads hit the same user scope -> run them concurrently
        const [
            profile,
            milestoneTaskAttempts,
            challengeSubmissions,
            codingSolves,
            xp,
            sourceCvText,
        ] = await Promise.all([
            this.gatherProfile(userId),
            this.gatherMilestoneTaskAttempts(userId),
            this.gatherChallengeSubmissions(userId),
            this.gatherCodingSolves(userId),
            this.gatherXp(userId),
            this.gatherSourceCvText(payload),
        ])

        return {
            profile,
            milestoneTaskAttempts,
            challengeSubmissions,
            codingSolves,
            xp,
            sourceCvText,
        }
    }

    /**
     * Verified profile fields for the CV header/contact block.
     */
    private async gatherProfile(
        userId: string,
    ): Promise<GatheredUserProfile> {
        const user = await this.entityManager.findOneOrFail(
            UserEntity,
            {
                where: {
                    id: userId,
                },
                select: {
                    id: true,
                    displayName: true,
                    bio: true,
                    roleTitle: true,
                    location: true,
                    linkedinUrl: true,
                    websiteUrl: true,
                    githubUsername: true,
                    workMode: true,
                    openToWork: true,
                },
            },
        )
        return {
            displayName: user.displayName,
            bio: user.bio,
            roleTitle: user.roleTitle,
            location: user.location,
            linkedinUrl: user.linkedinUrl,
            websiteUrl: user.websiteUrl,
            githubUsername: user.githubUsername,
            workMode: user.workMode,
            openToWork: user.openToWork,
        }
    }

    /**
     * All PASSED milestone/capstone task attempts (mirrors the milestone-task
     * attempts CMS join chain), scoped to enrollments owned by the user.
     */
    private async gatherMilestoneTaskAttempts(
        userId: string,
    ): Promise<Array<GatheredMilestoneTaskAttempt>> {
        const rows = await this.entityManager.query(
            `
            SELECT
                mt.title  AS task_title,
                m.title   AS milestone_title,
                c.title   AS course_title,
                mta.score AS score
            FROM user_milestone_task_attempts mta
            JOIN user_milestone_tasks umt ON umt.id = mta.user_milestone_task_id
            JOIN milestone_tasks mt ON mt.id = umt.milestone_task_id
            JOIN milestones m ON m.id = mt.milestone_id
            JOIN enrollments e ON e.id = umt.enrollment_id
            JOIN courses c ON c.id = e.course_id
            WHERE e.user_id = $1
              AND mta.passed = true
            ORDER BY mta.created_at DESC
            `,
            [
                userId,
            ],
        ) as Array<MilestoneTaskAttemptRow>
        return rows.map((row) => ({
            taskTitle: row.task_title,
            milestoneTitle: row.milestone_title,
            courseTitle: row.course_title,
            score: Number(row.score ?? 0),
        }))
    }

    /**
     * All graded challenge-submission attempts with a positive score (mirrors the
     * challenge-submissions CMS join chain), scoped to the user's submissions.
     */
    private async gatherChallengeSubmissions(
        userId: string,
    ): Promise<Array<GatheredChallengeSubmission>> {
        const rows = await this.entityManager.query(
            `
            SELECT
                COALESCE(ch.title, cs.title) AS challenge_title,
                c.title             AS course_title,
                ucsa.score          AS score,
                ucsa.submission_url AS submission_url,
                ucs.selected_lang   AS selected_lang
            FROM user_challenge_submission_attempts ucsa
            JOIN user_challenge_submissions ucs ON ucs.id = ucsa.user_challenge_submission_id
            JOIN challenge_submissions cs ON cs.id = ucs.submission_id
            LEFT JOIN challenges ch ON ch.id = cs.challenge_id
            LEFT JOIN contents co ON co.id = ch.content_id
            LEFT JOIN modules mo ON mo.id = co.module_id
            LEFT JOIN courses c ON c.id = mo.course_id
            WHERE ucs.user_id = $1
              AND ucsa.score > 0
              AND ucsa.processed_at IS NOT NULL
            ORDER BY ucsa.score DESC, ucsa.created_at DESC
            `,
            [
                userId,
            ],
        ) as Array<ChallengeSubmissionRow>
        return rows.map((row) => ({
            challengeTitle: row.challenge_title,
            courseTitle: row.course_title,
            score: Number(row.score ?? 0),
            submissionUrl: row.submission_url ?? null,
            selectedLang: row.selected_lang ?? null,
        }))
    }

    /**
     * All ACCEPTED coding-practice submissions joined to the problem for its
     * title / difficulty / domain, scoped to the user. De-duplicated by problem
     * (a user may have several accepted submissions for one problem).
     */
    private async gatherCodingSolves(
        userId: string,
    ): Promise<Array<GatheredCodingSolve>> {
        const rows = await this.entityManager.query(
            `
            SELECT DISTINCT
                cp.title      AS problem_title,
                cp.difficulty AS difficulty,
                cp.domain     AS domain
            FROM coding_submissions csub
            JOIN coding_problems cp ON cp.id = csub.coding_problem_id
            WHERE csub.user_id = $1
              AND csub.verdict = 'accepted'
            ORDER BY cp.difficulty, cp.title
            `,
            [
                userId,
            ],
        ) as Array<CodingSolveRow>
        return rows.map((row) => ({
            problemTitle: row.problem_title,
            difficulty: row.difficulty,
            domain: row.domain,
        }))
    }

    /**
     * Per-source XP totals (challenge / milestone / coding / lesson) from the
     * user's XP projection -- a signal for which skill categories to emphasize.
     * Missing projection -> all zeros.
     */
    private async gatherXp(
        userId: string,
    ): Promise<GatheredXpBreakdown> {
        const projection = await this.entityManager.findOne(
            UserXpProjectionEntity,
            {
                where: {
                    userId,
                },
            },
        )
        const value = (projection?.value ?? {
        }) as XpProjectionValue
        return {
            challengeXp: Number(value.challengeXp ?? 0),
            milestoneXp: Number(value.milestoneXp ?? 0),
            codingXp: Number(value.codingXp ?? 0),
            lessonXp: Number(value.lessonXp ?? 0),
        }
    }

    /**
     * `Revise` mode: resolve the source `cv_generations` row (`sourceCvSubmissionId`
     * -- unified table, covers both `Uploaded` and `Generated` sources) and
     * produce text for the compose prompt: buffer + extract the file for
     * `Uploaded`, or serialize the already-assembled `structuredData` for
     * `Generated`. Non-Revise, missing source id, or missing source material ->
     * `null` (compose then behaves like Generate).
     */
    private async gatherSourceCvText(
        payload: GenerateCvPayload,
    ): Promise<string | null> {
        if (payload.mode !== CvGenerationMode.Revise || !payload.sourceCvSubmissionId) {
            return null
        }
        const source = await this.entityManager.findOne(
            UserCvGenerationEntity,
            {
                where: {
                    id: payload.sourceCvSubmissionId,
                },
                select: {
                    id: true,
                    source: true,
                    uploadedCdnKey: true,
                    structuredData: true,
                },
            },
        )
        if (!source) {
            return null
        }
        if (source.source === CvSource.Uploaded) {
            const key = source.uploadedCdnKey
            if (!key) {
                return null
            }
            const buffer = await this.s3ReadService.buffer({
                key,
                provider: S3Provider.Minio,
            })
            if (!buffer || buffer.length === 0) {
                return null
            }
            const text = await extractCvText({
                buffer,
                key,
            })
            return text.length > 0 ? text : null
        }
        return source.structuredData
            ? JSON.stringify(
                source.structuredData,
                null,
                2,
            )
            : null
    }

    /**
     * Persist the gathered blob as this step's execution result + advance the step.
     */
    private async finalize(
        executionResult: GenerateCvGatherStepExecuteResult,
        context: JobExtendedContext<
            GenerateCvPayload,
            ExtendedGenerateCvContext
        >,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context
        await this.entityManager.transaction(
            async (entityManager) => {
                await this.jobActionService.increaseJob(
                    {
                        job,
                        entityManager,
                    },
                )
                await this.jobActionService.saveExecutionResult(
                    {
                        job,
                        key: this.stepName,
                        executionResult,
                        entityManager,
                    },
                )
            },
        )
        this.winstonService.log(
            WinstonLog.ProcessCVSubmissionStepExecuted,
            {
                jobId: job.id ?? "",
                queueName,
                step: this.stepName,
                stepIndex: this.stepIndex,
                payload,
                success: true,
            },
        )
    }
}
