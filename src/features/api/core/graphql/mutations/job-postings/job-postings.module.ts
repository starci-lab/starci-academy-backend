import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./job-postings.module-definition"
import {
    SubmitJobPostingSingleMutationModule,
} from "./submit-job-posting"

/**
 * Job posting mutation group (public job board submissions).
 */
@Module({
    imports: [
        SubmitJobPostingSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class JobPostingsMutationsModule extends ConfigurableModuleClass {}
