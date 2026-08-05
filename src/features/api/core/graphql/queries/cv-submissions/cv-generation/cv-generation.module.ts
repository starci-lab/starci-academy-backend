// ============================================================================
// WIRING TODO (another step wires the parent aggregator -- do NOT edit it here):
//   Register this module in
//   `src/features/api/core/graphql/queries/cv-submissions/cv-submissions.module.ts`
//   (class `CvSubmissionsQueriesModule`) alongside the other CV queries:
//
//     import {
//         CvGenerationSingleQueryModule,
//     } from "./cv-generation"
//
//     imports: [
//         ...,
//         CvGenerationSingleQueryModule.register({ isGlobal: true }),
//     ]
// ============================================================================

import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./cv-generation.module-definition"
import {
    CvGenerationResolver,
} from "./cv-generation.resolver"
import {
    CvGenerationService,
} from "./cv-generation.service"
import {
    CvGenerationHandler,
} from "./cv-generation.handler"

@Module({
    providers: [
        CvGenerationResolver,
        CvGenerationService,
        CvGenerationHandler,
    ],
})
/**
 * Wires resolver, service, and handler for the `cvGeneration` leaf (one run
 * with structured data + LaTeX/PDF). Register globally from the CV queries aggregator.
 */
export class CvGenerationSingleQueryModule extends ConfigurableModuleClass {}
