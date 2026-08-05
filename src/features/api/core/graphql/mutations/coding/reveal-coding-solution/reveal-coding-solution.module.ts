import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./reveal-coding-solution.module-definition"
import {
    RevealCodingSolutionResolver,
} from "./reveal-coding-solution.resolver"

@Module({
    providers: [
        RevealCodingSolutionResolver,
    ],
})
/**
 * Single-mutation module wiring the `revealCodingSolution` resolver into the
 * GraphQL schema.
 */
export class RevealCodingSolutionSingleMutationModule extends ConfigurableModuleClass {}
