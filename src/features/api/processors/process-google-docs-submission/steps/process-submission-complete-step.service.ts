import type {
    ProcessGoogleDocsSubmissionPayload,
} from "@modules/bullmq"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserChallengeSubmissionAttemptEntity,
    UserChallengeSubmissionFeedbackEntity,
    Locale,
    SubmissionFeedbackSeverity,
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
    JobExtendedContext,
} from "@modules/bussiness"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import type {
    ExtendedProcessGoogleDocsSubmissionContext,
    ProcessGoogleDocsSubmissionCompleteStepExecuteResult,
    ProcessGoogleDocsSubmissionGradeStepExecuteResult,
} from "../types"
import {
    DayjsService,
} from "@modules/mixin"
import {
    MissingOrInvalidGradeExecutionResultException,
} from "@modules/exceptions"
import {
    ProcessGoogleDocsSubmissionGradeStepService,
} from "./process-submission-grade-step.service"

/**
 * Step 5: persist grade and feedback to `submission_attempts`.
 */
@Injectable()
export class ProcessGoogleDocsSubmissionCompleteStepService extends AbstractStepService<
    ProcessGoogleDocsSubmissionPayload,
    ExtendedProcessGoogleDocsSubmissionContext
> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly jobActionService: JobActionService,
        private readonly winstonService: WinstonService,
        private readonly dayjsService: DayjsService,
        private readonly processGoogleDocsSubmissionGradeStepService: ProcessGoogleDocsSubmissionGradeStepService,
    ) {
        super()
    }

    stepIndex = 1

    stepName = "complete"
    /** Process the step. */
    async process(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<void> {
        const executionResult = await this.execute(context)
        await this.finalize(
            executionResult,
            context,
        )
    }

    /** Execute the step. */
    private async execute(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<ProcessGoogleDocsSubmissionCompleteStepExecuteResult> {
        /** Grade. */
        const grade = await this.jobActionService.loadExecutionResult<
            ProcessGoogleDocsSubmissionGradeStepExecuteResult
        >(
            {
                job: context.job,
                key: this.processGoogleDocsSubmissionGradeStepService.stepName,
            },
        )

        if (
            !grade
            || typeof grade.totalScore !== "number"
            || typeof grade.maxScore !== "number"
            || !Array.isArray(grade.requirementResults)
        ) {
            throw new MissingOrInvalidGradeExecutionResultException({
                grade,
            })
        }

        const locale = context.payload.locale ?? Locale.En

        await this.entityManager.transaction(async (em) => {
            const attemptCount = await em.count(
                UserChallengeSubmissionAttemptEntity,
                {
                    where: {
                        userChallengeSubmission: {
                            id: context.payload.userChallengeSubmissionId,
                        },
                    },
                },
            )
            const attempt = await em.save(
                UserChallengeSubmissionAttemptEntity,
                {
                    userChallengeSubmission: {
                        id: context.payload.userChallengeSubmissionId,
                    },
                    submissionUrl:
                        context.extended?.userChallengeSubmission.submissionUrl ?? "",
                    attemptNumber: attemptCount + 1,
                    score: grade.totalScore,
                    processedAt: this.dayjsService.now().toDate(),
                    shortFeedback: grade.failedRequirements === 0
                        ? "All criteria passed."
                        : `${grade.failedRequirements} criteria failed.`,
                    defaultLocale: locale,
                },
            )

            const feedbackEntities = grade.requirementResults
                .filter((cr) => !cr.passed)
                .map((msg, index) => {
                    const entity = new UserChallengeSubmissionFeedbackEntity()
                    entity.attempt = attempt
                    entity.message = msg.feedback
                    entity.detail = null
                    entity.location = msg.location?.trim() || null
                    entity.suggestion = msg.suggestion?.trim() || null
                    entity.severity = SubmissionFeedbackSeverity.Medium
                    entity.orderIndex = index
                    entity.defaultLocale = locale
                    return entity
                })

            await em.save(
                UserChallengeSubmissionFeedbackEntity,
                feedbackEntities,
            )
        })

        return {
        }
    }

    private async finalize(
        executionResult: ProcessGoogleDocsSubmissionCompleteStepExecuteResult,
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<void> {
        const {
            job,
            payload,
            queueName,
        } = context

        await this.entityManager.transaction(async (entityManager) => {
            await this.jobActionService.increaseJob({
                job,
                entityManager,
            })

            await this.jobActionService.saveExecutionResult({
                job,
                key: this.stepName,
                executionResult,
                entityManager,
            })
        })

        this.winstonService.log(
            WinstonLog.ProcessGitSubmissionStepExecuted,
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
