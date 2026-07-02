// ============================================================================
// WIRING TODO (another step wires the parent aggregator — do NOT edit it here):
//   Register this module in
//   `src/features/api/core/graphql/mutations/cv-submissions/cv-submissions.module.ts`
//   (class `CvSubmissionsMutationsModule`) alongside the other CV mutations:
//
//     import {
//         ReviseCvSingleMutationModule,
//     } from "./revise-cv"
//
//     imports: [
//         ...,
//         ReviseCvSingleMutationModule.register({ isGlobal: true }),
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
    ReviseCvResolver,
} from "./revise-cv.resolver"
import {
    ReviseCvService,
} from "./revise-cv.service"
import {
    ReviseCvHandler,
} from "./revise-cv.handler"
import {
    ConfigurableModuleClass,
} from "./revise-cv.module-definition"

@Module({
    imports: [
        CqrsModule,
    ],
    providers: [
        ReviseCvResolver,
        ReviseCvService,
        ReviseCvHandler,
    ],
    exports: [
        ReviseCvService,
    ],
})
export class ReviseCvSingleMutationModule extends ConfigurableModuleClass {}
