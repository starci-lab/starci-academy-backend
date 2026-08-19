import {
    Injectable,
} from "@nestjs/common"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    AiModelCatalogService,
} from "@modules/ai/balancer/ai-model-catalog.service"
import {
    AiCeilSurface,
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    DEFAULT_MODEL_CREDIT,
} from "@modules/ai/constants/credit-cost"
import type {
    AbstractSubmissionCompletionGradeResult,
} from "./abstract-submission-complete-step.service"
import type {
    ChargeLegacyCreditIfNeededParams,
} from "./types/complete"

@Injectable()
/**
 * Owns the legacy (pre-invoke-charge) credit-debit fallback for a graded challenge-submission
 * completion: the V2 grade step already debits + records credit history at invoke time (marked
 * via the job's `creditCharged` execution-result key); this only fires for the legacy V1 grade
 * path that never charged up front.
 *
 * Always invoked by {@link AbstractSubmissionCompleteStepService} AFTER its completion
 * transaction has already committed -- the debit itself (via {@link AiEntitlementService.consume})
 * is its own separately-committed write, never part of the completion transaction.
 */
export class LegacyCreditChargeService {
    constructor(
        private readonly jobActionService: JobActionService,
        private readonly aiEntitlementService: AiEntitlementService,
        private readonly aiModelCatalogService: AiModelCatalogService,
    ) {
    }

    /**
     * Debit + record credit history for the legacy V1 grade path, only when this run created
     * the attempt and no charge is already on record for this job.
     * @param params - The job (to check the charge marker), grade, and completion outcome.
     */
    async chargeLegacyCreditIfNeeded<
        TGrade extends AbstractSubmissionCompletionGradeResult,
    >(
        {
            job,
            grade,
            createdNewAttempt,
            chargedUserId,
        }: ChargeLegacyCreditIfNeededParams<TGrade>,
    ): Promise<void> {
        const alreadyCharged = await this.jobActionService.loadExecutionResult<boolean>({
            job,
            key: "creditCharged",
        })
        if (!createdNewAttempt || !chargedUserId || alreadyCharged) {
            return
        }
        await this.aiEntitlementService.consume({
            userId: chargedUserId,
            // charge by the model that actually served (catalog credit)
            cost: grade.aiUsage?.model
                ? await this.aiModelCatalogService.creditForRun({
                    name: grade.aiUsage.model,
                    promptTokens: grade.aiUsage.promptTokens,
                    completionTokens: grade.aiUsage.completionTokens,
                    cachedTokens: grade.aiUsage.cachedTokens,
                    fallback: DEFAULT_MODEL_CREDIT,
                })
                : 0,
            surface: AiCeilSurface.Grading,
            task: AiModelTask.ChallengeGrading,
            model: grade.aiUsage?.model ?? null,
            provider: grade.aiUsage?.provider ?? null,
            recommendation: null,
            promptTokens: grade.aiUsage?.promptTokens ?? null,
            completionTokens: grade.aiUsage?.completionTokens ?? null,
            attempts: grade.aiUsage?.attempts ?? null,
        })
    }
}
