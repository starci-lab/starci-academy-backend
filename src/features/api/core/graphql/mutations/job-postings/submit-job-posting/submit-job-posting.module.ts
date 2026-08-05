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
/**
 * Registers the employer job-posting write so listing creation stays its
 * own Nest unit under the job-postings aggregator.
 */
export class SubmitJobPostingSingleMutationModule extends ConfigurableModuleClass {}
