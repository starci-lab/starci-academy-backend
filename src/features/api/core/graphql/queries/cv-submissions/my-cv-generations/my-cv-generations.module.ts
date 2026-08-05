// ============================================================================
// WIRING TODO (another step wires the parent aggregator -- do NOT edit it here):
//   Register this module in
//   `src/features/api/core/graphql/queries/cv-submissions/cv-submissions.module.ts`
//   (class `CvSubmissionsQueriesModule`) alongside the other CV queries:
//
//     import {
//         MyCvGenerationsSingleQueryModule,
//     } from "./my-cv-generations"
//
//     imports: [
//         ...,
//         MyCvGenerationsSingleQueryModule.register({ isGlobal: true }),
//     ]
// ============================================================================

import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-cv-generations.module-definition"
import {
    MyCvGenerationsResolver,
} from "./my-cv-generations.resolver"
import {
    MyCvGenerationsService,
} from "./my-cv-generations.service"
import {
    MyCvGenerationsHandler,
} from "./my-cv-generations.handler"

@Module({
    providers: [
        MyCvGenerationsResolver,
        MyCvGenerationsService,
        MyCvGenerationsHandler,
    ],
})
/**
 * Wires resolver, service, and handler for `myCvGenerations` (lightweight
 * history list). Register globally from the CV queries aggregator.
 */
export class MyCvGenerationsSingleQueryModule extends ConfigurableModuleClass {}
