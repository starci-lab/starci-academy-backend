import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./submit-job-posting.module-definition"
import {
    SubmitJobPostingResolver,
} from "./submit-job-posting.resolver"

@Module({
    providers: [
        SubmitJobPostingResolver,
    ],
})
export class SubmitJobPostingSingleMutationModule extends ConfigurableModuleClass {}
