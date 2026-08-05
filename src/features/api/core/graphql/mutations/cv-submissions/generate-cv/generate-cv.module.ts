// ============================================================================
// WIRING TODO (another step wires the parent aggregator — do NOT edit it here):
//   Register this module in
//   `src/features/api/core/graphql/mutations/cv-submissions/cv-submissions.module.ts`
//   (class `CvSubmissionsMutationsModule`) alongside the other CV mutations:
//
//     import {
//         GenerateCvSingleMutationModule,
//     } from "./generate-cv"
//
//     imports: [
//         ...,
//         GenerateCvSingleMutationModule.register({ isGlobal: true }),
//     ]
//
//   Note: `EnqueueGenerateCvJobService` is injected from the globally-registered
//   `GenerateCvModule` (app root), so no processor import is needed here.
// ============================================================================

import {
    Module,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    GenerateCvResolver,
} from "./generate-cv.resolver"
import {
    GenerateCvService,
} from "./generate-cv.service"
import {
    GenerateCvHandler,
} from "./generate-cv.handler"
import {
    ConfigurableModuleClass,
} from "./generate-cv.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        GenerateCvResolver,
        GenerateCvService,
        GenerateCvHandler,
    ],
    exports: [
        GenerateCvService,
    ],
})
/** Isolated Nest registration for generate-cv without wiring upload/revise into the same graph. */
export class GenerateCvSingleMutationModule extends ConfigurableModuleClass {}
