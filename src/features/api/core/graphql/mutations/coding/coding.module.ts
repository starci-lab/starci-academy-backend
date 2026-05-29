import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./coding.module-definition"
import {
    SubmitCodingSolutionSingleMutationModule,
} from "./submit-coding-solution"

/**
 * Coding-practice mutation group: submit a solution for judging.
 */
@Module({
    imports: [
        SubmitCodingSolutionSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class CodingMutationsModule extends ConfigurableModuleClass {}
