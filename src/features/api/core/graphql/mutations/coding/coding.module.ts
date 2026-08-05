import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./coding.module-definition"
import {
    SubmitCodingSolutionSingleMutationModule,
} from "./submit-coding-solution/submit-coding-solution.module"
import {
    RevealCodingSolutionSingleMutationModule,
} from "./reveal-coding-solution/reveal-coding-solution.module"

@Module({
    imports: [
        SubmitCodingSolutionSingleMutationModule.register({
            isGlobal: true,
        }),
        RevealCodingSolutionSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Coding-practice mutation group: submit a solution for judging, and record a
 * reference-solution reveal (which forfeits the problem's points).
 */
export class CodingMutationsModule extends ConfigurableModuleClass {}
