import type {
    ProccessGitUrlPayload,
} from "@modules/bullmq"
import {
    ChallengePromptEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserChallengeSubmissionEntity,
} from "@modules/databases"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    AbstractStepService,
} from "../../abstracts"
import type {
    JobContext,
} from "../../types"
import type {
    ProccessGitUrlPipelineContext,
} from "../types"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"

/**
 * Step 0: load `user_challenge_submissions` row and `challenge_prompts` from the database.
 */
@Injectable()
export class ProccessGitUrlResolveContextStepService extends AbstractStepService<ProccessGitUrlPayload> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
    ) {
        super()
    }

    stepIndex = 0

    stepName = "resolve-context"

    async process(
        context: JobContext<ProccessGitUrlPayload>,
    ): Promise<void> {
        const pipeline = context as ProccessGitUrlPipelineContext
        await this.execute(pipeline)
        await this.finalize(pipeline)
    }

    private async execute(
        context: ProccessGitUrlPipelineContext,
    ): Promise<void> {
        const {
            challengeId,
            userId,
            submissionId,
        } = context.payload
        const userChallengeSubmission = await this.entityManager.findOne(
            UserChallengeSubmissionEntity,
            {
                where: {
                    userId,
                    submissionId,
                },
                relations: {
                    submission: {
                        challenge: true,
                    },
                },
            },
        )
        if (!userChallengeSubmission) {
            throw new Error(
                "User challenge submission not found for the given user and submission id.",
            )
        }
        if (userChallengeSubmission.submission.challenge.id !== challengeId) {
            throw new Error(
                "Challenge id does not match the submission's challenge.",
            )
        }
        const gradingPrompts = await this.entityManager.find(
            ChallengePromptEntity,
            {
                where: {
                    challenge: {
                        id: challengeId,
                    },
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        if (!gradingPrompts.length) {
            throw new Error(
                "No challenge prompts configured in the database for grading.",
            )
        }
        context.userChallengeSubmission = userChallengeSubmission
        context.submissionUrl = userChallengeSubmission.submissionUrl
        context.gradingPrompts = gradingPrompts
    }

    private async finalize(
        context: ProccessGitUrlPipelineContext,
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
                        executionResult: {
                            promptCount: context.gradingPrompts?.length ?? 0,
                            submissionUrlPresent: Boolean(context.submissionUrl),
                        },
                        entityManager,
                    },
                )
            },
        )
        this.winstonService.log(
            WinstonLog.ProcessGitUrlStepExecuted,
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
