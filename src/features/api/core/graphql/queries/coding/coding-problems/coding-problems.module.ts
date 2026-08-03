import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./coding-problems.module-definition"
import {
    CodingProblemsResolver,
} from "./coding-problems.resolver"

/** Wires the `codingProblems` list query resolver as its own registrable module. */
@Module({
    providers: [
        CodingProblemsResolver,
    ],
})
export class CodingProblemsSingleQueryModule extends ConfigurableModuleClass {}
