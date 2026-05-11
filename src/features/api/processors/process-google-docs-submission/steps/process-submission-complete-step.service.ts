import type {
    ProcessGoogleDocsSubmissionPayload,
} from "@modules/bullmq"
import {
    JobActionService,
} from "@modules/bussiness"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness"
import {
    EmptyObject,
} from "@modules/common"
import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserChallengeSubmissionAttemptEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import {
    ProcessGoogleDocsSubmissionGradeStepService,
} from "./process-submission-grade-step.service"
import type {
    ExtendedProcessGoogleDocsSubmissionContext,
    ProcessGoogleDocsSubmissionGradeStepExecuteResult,
} from "../types"
import {
    MissingOrInvalidGradeExecutionResultException,
} from "@modules/exceptions"
import {
    DayjsService,
} from "@modules/mixin"

/**
 * Step 1: finalize — load grade result, persist attempt + feedbacks, emit event.
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
        private readonly gradeStepService: ProcessGoogleDocsSubmissionGradeStepService,
        private readonly eventEmitterService: EventEmitterService,
        private readonly dayjsService: DayjsService,
    ) {
        super()
    }

    stepIndex = 1
    stepName = "complete"

    async process(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<void> {
        const executionResult = await this.execute(context)
        await this.finalize(executionResult,
            context)
    }

    private async execute(
        context: JobExtendedContext<
            ProcessGoogleDocsSubmissionPayload,
            ExtendedProcessGoogleDocsSubmissionContext
        >,
    ): Promise<EmptyObject> {
        const { payload } = context
        const grade = await this.jobActionService.loadExecutionResult<ProcessGoogleDocsSubmissionGradeStepExecuteResult>(
            {
                job: context.job,
                key: this.gradeStepService.stepName,
            },
        )
        if (!grade) {
            throw new MissingOrInvalidGradeExecutionResultException({
                grade,
            })
        }
        if (typeof grade.evaluation !== "object" || typeof grade.passed !== "boolean") {
            throw new MissingOrInvalidGradeExecutionResultException({
                grade,
            })
        }
        await this.entityManager.transaction(
            async (entityManager) => {
                /** Fetch all attempts for this user challenge submission */
                const numAttempts = await entityManager.count(
                    UserChallengeSubmissionAttemptEntity,
                    {
                        where: {
                            userChallengeSubmission: {
                                id: payload.userChallengeSubmissionId,
                            },
                        },
                    },
                )
                /** Map the grade evaluation details to feedbacks */
                const feedbackRaws = grade.evaluation.details.map(
                    (detail) => {
                        return detail.feedbacks.map((feedback) => {
                            return {
                                message: feedback.message,
                                severity: feedback.severity,
                                location: feedback.location,
                                suggestion: feedback.suggestion,
                            }
                        })
                    }).flat()
                /** Map the feedbacks to the user challenge submission attempt */
                const feedbacks = feedbackRaws.map(
                    (feedback, index) => {
                        return {
                            ...feedback,
                            orderIndex: index,
                            defaultLocale: payload.locale ?? Locale.En,
                        }
                    }
                )
                /** Save the user challenge submission attempt */
                await entityManager.save(
                    UserChallengeSubmissionAttemptEntity,
                    {
                        userChallengeSubmission: {
                            id: payload.userChallengeSubmissionId,
                        },
                        submissionUrl:
                            context.extended?.userChallengeSubmission.submissionUrl ?? "",
                        processedAt: this.dayjsService.now().toDate(),
                        score: grade.evaluation.score,
                        shortFeedback: grade.evaluation.shortFeedback,
                        attemptNumber: numAttempts + 1,
                        defaultLocale: payload.locale ?? Locale.En,
                        feedbacks,
                    }
                )
            }
        )
        return {
        }
    }

    private async finalize(
        executionResult: EmptyObject,
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
        await this.entityManager.transaction(
            async (entityManager) => {
                await this.jobActionService.increaseJob(
                    {
                        job,
                        entityManager,
                    }
                )
                await this.jobActionService.saveExecutionResult(
                    {
                        job,
                        key: this.stepName,
                        executionResult,
                        entityManager,
                    }
                )
            }
        )
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
        this.eventEmitterService.emit({
            event: EventName.ChallengeSubmissionProgressUpdated,
            payload: {
                enrollmentId: payload.enrollmentId,
            },
        })
    }
}
