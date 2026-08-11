import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./job-postings.module-definition"
import {
    JobPostingsSingleQueryModule,
} from "./job-postings/job-postings.module"
import {
    JobPostingSingleQueryModule,
} from "./job-posting/job-posting.module"
import {
    JobApplicationsSingleQueryModule,
} from "./job-applications/job-applications.module"

@Module({
    imports: [
        JobPostingsSingleQueryModule.register({
            isGlobal: true,
        }),
        JobPostingSingleQueryModule.register({
            isGlobal: true,
        }),
        JobApplicationsSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Public "IT job board" queries -- structured postings, distinct from the
 * `headhuntings` module's freestyle consultant directory.
 */
export class JobPostingsModule extends ConfigurableModuleClass {}
