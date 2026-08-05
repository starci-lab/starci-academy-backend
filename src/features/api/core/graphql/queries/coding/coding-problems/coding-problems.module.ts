import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./coding-problems.module-definition"
import {
    CodingProblemsResolver,
} from "./coding-problems.resolver"

@Module({
    providers: [
        CodingProblemsResolver,
    ],
})
/** Wires the `codingProblems` list query resolver as its own registrable module. */
export class CodingProblemsSingleQueryModule extends ConfigurableModuleClass {}
