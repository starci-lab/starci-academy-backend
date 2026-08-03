import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./coding-problem.module-definition"
import {
    CodingProblemResolver,
} from "./coding-problem.resolver"

/** Wires the `codingProblem` query resolver as its own registrable module. */
@Module({
    providers: [
        CodingProblemResolver,
    ],
})
export class CodingProblemSingleQueryModule extends ConfigurableModuleClass {}
