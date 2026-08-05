import {
    Injectable,
} from "@nestjs/common"
import {
    AbstractStepService,
} from "@modules/bussiness/jobs/types/context"
import type {
    GenerateCvPayload,
} from "@modules/integrations/bullmq/types/payloads/generate-cv"
import {
    GenerateCvCompleteStepService,
} from "./steps/generate-cv-complete-step.service"
import {
    GenerateCvComposeStepService,
} from "./steps/generate-cv-compose-step.service"
import {
    GenerateCvGatherStepService,
} from "./steps/generate-cv-gather-step.service"
import {
    GenerateCvRenderStepService,
} from "./steps/generate-cv-render-step.service"
import {
    GenerateCvScoreStepService,
} from "./steps/generate-cv-score-step.service"
import type {
    ExtendedGenerateCvContext,
} from "./types/extended"

@Injectable()
/**
 * Generate-CV pipeline step map:
 * gather (0) -> compose (1) -> render (2) -> score (3) -> complete (4).
 * The worker looks up the step for the job's `currentStep` and runs it; each step
 * advances `currentStep` on finalize until it reaches `maxSteps` (5).
 */
export class GenerateCvStepMappingService {
    constructor(
        private readonly gatherStepService: GenerateCvGatherStepService,
        private readonly composeStepService: GenerateCvComposeStepService,
        private readonly renderStepService: GenerateCvRenderStepService,
        private readonly scoreStepService: GenerateCvScoreStepService,
        private readonly completeStepService: GenerateCvCompleteStepService,
    ) { }

    /**
     * Get the step map.
     * @returns The step map keyed by step index.
     */
    getStepMap(): Map<
        number,
        AbstractStepService<
            GenerateCvPayload,
            ExtendedGenerateCvContext
        >
        > {
        return new Map<number, AbstractStepService<
            GenerateCvPayload,
            ExtendedGenerateCvContext
        >>(
            [
                [
                    this.gatherStepService.stepIndex,
                    this.gatherStepService,
                ],
                [
                    this.composeStepService.stepIndex,
                    this.composeStepService,
                ],
                [
                    this.renderStepService.stepIndex,
                    this.renderStepService,
                ],
                [
                    this.scoreStepService.stepIndex,
                    this.scoreStepService,
                ],
                [
                    this.completeStepService.stepIndex,
                    this.completeStepService,
                ],
            ],
        )
    }
}
