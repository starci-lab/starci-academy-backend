import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./job-postings.module-definition"
import {
    JobPostingsResolver,
} from "./job-postings.resolver"
import {
    JobPostingsService,
} from "./job-postings.service"
import {
    JobPostingsHandler,
} from "./job-postings.handler"

@Module({
    providers: [
        JobPostingsService,
        JobPostingsResolver,
        JobPostingsHandler,
    ],
})
/**
 * Wires the public `jobPostings` board listing (newest first, optional
 * filters/search). No auth -- structured IT postings, distinct from the
 * headhunting consultant directory.
 */
export class JobPostingsSingleQueryModule extends ConfigurableModuleClass {}
