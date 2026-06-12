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
export class RevealCodingSolutionSingleMutationModule extends ConfigurableModuleClass {}
