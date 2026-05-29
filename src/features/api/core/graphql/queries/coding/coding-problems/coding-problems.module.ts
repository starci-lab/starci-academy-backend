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
export class CodingProblemsSingleQueryModule extends ConfigurableModuleClass {}
