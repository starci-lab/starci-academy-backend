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

/**
 * Public "IT job board" queries — structured postings, distinct from the
 * `headhuntings` module's freestyle consultant directory.
 */
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
export class JobPostingsModule extends ConfigurableModuleClass {}
