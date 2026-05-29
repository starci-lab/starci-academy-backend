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
export class SubmitCodingSolutionSingleMutationModule extends ConfigurableModuleClass {}
