import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./submit-coding-solution.module-definition"
import {
    SubmitCodingSolutionResolver,
} from "./submit-coding-solution.resolver"

/**
 * Single-mutation module wiring the `submitCodingSolution` resolver into the
 * GraphQL schema.
 */
@Module({
    providers: [
        SubmitCodingSolutionResolver,
    ],
})
export class SubmitCodingSolutionSingleMutationModule extends ConfigurableModuleClass {}
