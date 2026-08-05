// ============================================================================
// WIRING TODO (final wire step): register this module in
// `src/features/api/processors/processors.module.ts` alongside the other AI
// processors:  `GenerateCvModule.register({ isGlobal: true })`.
// The worker + steps are declared as providers below; RagModule /
// LangchainModule / S3Module / Qdrant / etc. are globally registered at app
// root, so no imports are needed here (CvRagRetrievalService is injected from
// the global RagModule -- see the enqueue/compose TODOs).
// ============================================================================

import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./generate-cv.module-definition"
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
import {
    GenerateCvStepMappingService,
} from "./step-mapping.service"
import {
    GenerateCvWorker,
} from "./generate-cv.worker"
import {
    EnqueueGenerateCvJobService,
} from "./enqueue-generate-cv.service"
import {
    CvScoringService,
} from "../shared/cv-scoring/cv-scoring.service"
import {
    ScoreUploadedCvService,
} from "../shared/cv-scoring/score-uploaded-cv.service"

@Module({
    providers: [
        GenerateCvWorker,
        GenerateCvStepMappingService,
        GenerateCvGatherStepService,
        GenerateCvComposeStepService,
        GenerateCvRenderStepService,
        GenerateCvScoreStepService,
        GenerateCvCompleteStepService,
        // SOURCE-AGNOSTIC scoring service (shared with the upload path).
        CvScoringService,
        // WF-07 upload-scoring path: buffers `uploadedCdnKey` -> extracts text ->
        // scores via the shared CvScoringService (`cvText` branch) -> persists.
        ScoreUploadedCvService,
        EnqueueGenerateCvJobService,
    ],
    // EnqueueGenerateCvJobService is exported so the GraphQL CV-generation
    // mutation module can inject it (after importing the global GenerateCvModule).
    // ScoreUploadedCvService is exported so the upload mutation/processor (the
    // remaining WF-07 wiring) can inject it to grade an uploaded row.
    exports: [
        EnqueueGenerateCvJobService,
        ScoreUploadedCvService,
    ],
})
/**
 * Wires the CV generate pipeline and exports enqueue + upload-score services so GraphQL
 * mutations can start jobs without owning BullMQ.
 */
export class GenerateCvModule extends ConfigurableModuleClass {}
