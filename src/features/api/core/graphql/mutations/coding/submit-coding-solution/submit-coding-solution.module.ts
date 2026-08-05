import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./submit-coding-solution.module-definition"
import {
    SubmitCodingSolutionResolver,
} from "./submit-coding-solution.resolver"

@Module({
    providers: [
        SubmitCodingSolutionResolver,
    ],
})
/**
 * Single-mutation module wiring the `submitCodingSolution` resolver into the
 * GraphQL schema.
 */
export class SubmitCodingSolutionSingleMutationModule extends ConfigurableModuleClass {}
