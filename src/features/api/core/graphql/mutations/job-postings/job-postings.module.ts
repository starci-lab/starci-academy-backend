import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./job-postings.module-definition"
import {
    SubmitJobPostingSingleMutationModule,
} from "./submit-job-posting/submit-job-posting.module"

@Module({
    imports: [
        SubmitJobPostingSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Job posting mutation group (public job board submissions).
 */
export class JobPostingsMutationsModule extends ConfigurableModuleClass {}
