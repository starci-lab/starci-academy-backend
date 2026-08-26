import {
    JobActionService
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    AbstractStepService,
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
import {
    InjectPrimaryPostgreSQLEntityManager
} from "@modules/databases/postgresql/primary/primary.decorators"
import type {
    EntityManager
} from "typeorm"
import {
    WinstonLog
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService
} from "@modules/platform/winston/winston.service"
import {
    EnrollmentEntity
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import type {
    JobEntity
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    AiCeilSurface
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
import {
    AiModelTask
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import type {
    AiEntitlementService
} from "@modules/ai/ai-entitlement.service"
import type {
    ConsumeEntitlementParams
} from "@modules/ai/types/ai-entitlement"
import type {
    AbstractSubmissionCompletionGradeResult
} from "./abstract-submission-complete-step.service"
import {
    UserChallengeSubmissionAttemptEntity
} from "@modules/databases/postgresql/primary/entities/user-challenge-submission-attempt.entity"

/** Params for {@link AbstractSubmissionGradeStepService.chargeGradingCreditOnce}. */
type ChargeGradingCreditOnceParams = Pick<
  ConsumeEntitlementParams,
  | "userId"
  | "cost"
  | "model"
  | "provider"
  | "promptTokens"
  | "completionTokens"
  | "attempts"
> & {
  /** Job row the idempotency marker is stored against. */
  job: JobEntity;
  /** Caller's own injected entitlement service -- kept per-caller rather than a base-class field. */
  aiEntitlementService: AiEntitlementService;
};

/**
 * Shared "grade" step (stepIndex 0) skeleton for challenge-submission grading pipelines:
 * `process` runs {@link execute} then persists + logs its result via {@link finalize}, and fails
 * the job on any error. This is everything that is genuinely identical in intent between the
 * git-submission and Google-Docs-submission grade steps.
 *
 * {@link execute} itself -- HOW the evaluation is produced (cloning a repo vs. fetching a Google
 * Doc, and the different AI-floor business rule each source's grading quality earns) -- is a real
 * difference and stays implemented per pipeline, not here.
 */
export abstract class AbstractSubmissionGradeStepService<
  TPayload extends { attemptId?: string },
  TExtended,
  TGrade extends AbstractSubmissionCompletionGradeResult,
> extends AbstractStepService<TPayload, TExtended> {
    protected constructor(
    @InjectPrimaryPostgreSQLEntityManager()
    protected readonly entityManager: EntityManager,
    protected readonly jobActionService: JobActionService,
    protected readonly winstonService: WinstonService,
    ) {
        super()
    }

    stepIndex = 0
    stepName = "grade"

    /**
   * Process the grade step.
   */
    async process(
        context: JobExtendedContext<TPayload, TExtended>,
    ): Promise<void> {
        try {
            const executionResult = await this.execute(context)
            await this.finalize(executionResult,
                context)
        } catch (error) {
            const unavailableAttempt = {
                status: "evaluation_unavailable" as const,
                uncertainty:
          "Evaluation is temporarily unavailable. Your submitted attempt is preserved and can be resumed safely.",
            }
            if (context.payload.attemptId) {
                await this.entityManager.update(
                    UserChallengeSubmissionAttemptEntity,
                    {
                        id: context.payload.attemptId,
                    },
                    unavailableAttempt,
                )
            } else {
                await this.entityManager.update(
                    UserChallengeSubmissionAttemptEntity,
                    {
                        idempotencyKey: context.job.id,
                        processedAt: null,
                    },
                    unavailableAttempt,
                )
            }
            await this.jobActionService.failJob({
                job: context.job,
                error:
          error instanceof Error
              ? error.message
              : "Unknown challenge evaluation failure",
            })
            throw error
        }
    }

  /**
   * Execute the grade step: load the submitted source, retrieve the grading excerpt, and
   * have the LLM grade each criterion. Each pipeline resolves its own source and AI floor.
   */
  protected abstract execute(
    context: JobExtendedContext<TPayload, TExtended>,
  ): Promise<TGrade>;

  /**
   * Resolve the submitter's enrollment and block on the unified credit pool before spending on
   * the grading run. Shared verbatim between the git-submission and Google-Docs-submission grade
   * steps -- the entitlement service itself stays each caller's own injected dependency so this
   * base class does not grow a constructor of its own.
   *
   * @param enrollmentId - The submitting enrollment.
   * @param aiEntitlementService - The caller's injected entitlement service.
   * @returns The hydrated enrollment.
   */
  protected async resolveQuotaCheckedEnrollment(
      enrollmentId: string,
      aiEntitlementService: AiEntitlementService,
  ): Promise<EnrollmentEntity> {
      const enrollment = await this.entityManager.findOneOrFail(
          EnrollmentEntity,
          {
              where: {
                  id: enrollmentId,
              },
          },
      )
      await aiEntitlementService.assertNotOverQuota({
          userId: enrollment.userId,
      })
      return enrollment
  }

  /**
   * Charge for the LLM usage NOW (idempotently), BEFORE parsing -- a parse failure must not leak
   * free usage. The `creditCharged` marker keeps a stalled re-run from double-charging, and the
   * complete step skips its own debit when this marker is present. Shared verbatim between the
   * git-submission and Google-Docs-submission grade steps, which both charge under the same
   * {@link AiCeilSurface.Grading} surface and {@link AiModelTask.ChallengeGrading} task.
   *
   * @param params - {@link ChargeGradingCreditOnceParams}
   */
  protected async chargeGradingCreditOnce({
      job,
      aiEntitlementService,
      userId,
      cost,
      model,
      provider,
      promptTokens,
      completionTokens,
      attempts,
  }: ChargeGradingCreditOnceParams): Promise<void> {
      const alreadyCharged =
      await this.jobActionService.loadExecutionResult<boolean>({
          job,
          key: "creditCharged",
      })
      if (alreadyCharged) {
          return
      }
      await aiEntitlementService.consume({
          userId,
          // charge by the model that actually served (from run)
          cost,
          surface: AiCeilSurface.Grading,
          task: AiModelTask.ChallengeGrading,
          model,
          provider,
          recommendation: null,
          promptTokens,
          completionTokens,
          attempts,
      })
      await this.jobActionService.saveExecutionResult({
          job,
          key: "creditCharged",
          executionResult: true,
      })
  }

  /**
   * Finalize the grade step: persist the execution result for the complete step.
   */
  private async finalize(
      executionResult: TGrade,
      context: JobExtendedContext<TPayload, TExtended>,
  ): Promise<void> {
      const { job, payload, queueName } = context
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
      this.winstonService.log(WinstonLog.ProcessGitSubmissionStepExecuted,
          {
              jobId: job.id ?? "",
              queueName,
              step: this.stepName,
              stepIndex: this.stepIndex,
              payload,
              success: true,
          })
  }
}
