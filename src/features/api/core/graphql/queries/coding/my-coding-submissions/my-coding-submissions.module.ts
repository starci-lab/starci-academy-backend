import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./my-coding-submissions.module-definition"
import {
    MyCodingSubmissionsResolver,
} from "./my-coding-submissions.resolver"

@Module({
    providers: [
        MyCodingSubmissionsResolver,
    ],
})
export class MyCodingSubmissionsSingleQueryModule extends ConfigurableModuleClass {}
