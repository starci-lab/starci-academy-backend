import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./coding.module-definition"
import {
    SubmitCodingSolutionSingleMutationModule,
} from "./submit-coding-solution"
import {
    RevealCodingSolutionSingleMutationModule,
} from "./reveal-coding-solution"

/**
 * Coding-practice mutation group: submit a solution for judging, and record a
 * reference-solution reveal (which forfeits the problem's points).
 */
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
export class CodingMutationsModule extends ConfigurableModuleClass {}
