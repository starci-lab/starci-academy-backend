import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./coding-problem-hint.module-definition"
import {
    CodingProblemHintResolver,
} from "./coding-problem-hint.resolver"

@Module({
    providers: [
        CodingProblemHintResolver,
    ],
})
/** Wires the `codingProblemHint` query resolver as its own registrable module. */
export class CodingProblemHintSingleQueryModule extends ConfigurableModuleClass {}
