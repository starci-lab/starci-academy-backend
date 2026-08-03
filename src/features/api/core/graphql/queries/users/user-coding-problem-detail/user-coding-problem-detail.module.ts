import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./user-coding-problem-detail.module-definition"
import {
    UserCodingProblemDetailResolver,
} from "./user-coding-problem-detail.resolver"
import {
    UserCodingProblemDetailService,
} from "./user-coding-problem-detail.service"

/**
 * NestJS module for the `userCodingProblemDetail` public-profile query. Wires
 * the resolver and its service; the service in turn composes the shared
 * `CodingProblemService` / `CodingSubmissionService` from the business layer.
 */
@Module({
    providers: [
        UserCodingProblemDetailService,
        UserCodingProblemDetailResolver,
    ],
})
export class UserCodingProblemDetailSingleQueryModule extends ConfigurableModuleClass {}
