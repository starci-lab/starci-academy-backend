import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./job-posting.module-definition"
import {
    JobPostingResolver,
} from "./job-posting.resolver"
import {
    JobPostingService,
} from "./job-posting.service"
import {
    JobPostingHandler,
} from "./job-posting.handler"

@Module({
    providers: [
        JobPostingService,
        JobPostingResolver,
        JobPostingHandler,
    ],
})
/**
 * Wires the public `jobPosting` detail query (by display id, employer
 * company resolved). No auth — mirrors the headhunting company directory.
 */
export class JobPostingSingleQueryModule extends ConfigurableModuleClass {}
