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
export class CodingProblemSingleQueryModule extends ConfigurableModuleClass {}
