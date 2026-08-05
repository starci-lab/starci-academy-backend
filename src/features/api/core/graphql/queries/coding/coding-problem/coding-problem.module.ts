import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./coding-problem.module-definition"
import {
    CodingProblemResolver,
} from "./coding-problem.resolver"

@Module({
    providers: [
        CodingProblemResolver,
    ],
})
/** Wires the `codingProblem` query resolver as its own registrable module. */
export class CodingProblemSingleQueryModule extends ConfigurableModuleClass {}
