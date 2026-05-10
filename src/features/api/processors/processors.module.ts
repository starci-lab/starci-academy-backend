import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./processors.module-definition"
import {
    SendMailModule,
} from "./send-mail"
import {
    ResolveGithubModule,
} from "./resolve-github"
import {
    ProcessPersonalProjectModule,
} from "./process-personal-project"
import {
    ReviewMilestoneTaskModule,
} from "./review-milestone-task"

/**
 * Module for API-side BullMQ processors.
 */
@Module({
    imports: [
        SendMailModule.register({
            isGlobal: true,
        }),
        ResolveGithubModule.register({
            isGlobal: true,
        }),
        ProcessPersonalProjectModule.register({
            isGlobal: true,
        }),
        ReviewMilestoneTaskModule.register({
            isGlobal: true,
        }),
    ],
})
export class ProcessorsModule extends ConfigurableModuleClass {}
