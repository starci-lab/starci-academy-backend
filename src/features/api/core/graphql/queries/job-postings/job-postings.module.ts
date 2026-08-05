import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./job-postings.module-definition"
import {
    JobPostingsSingleQueryModule,
} from "./job-postings"
import {
    JobPostingSingleQueryModule,
} from "./job-posting"

@Module({
    imports: [
        JobPostingsSingleQueryModule.register({
            isGlobal: true,
        }),
        JobPostingSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Public "IT job board" queries -- structured postings, distinct from the
 * `headhuntings` module's freestyle consultant directory.
 */
export class JobPostingsModule extends ConfigurableModuleClass {}
