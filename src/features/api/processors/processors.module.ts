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
    GeneratePersonalProjectMilestonesModule,
} from "./generate-personal-project-milestones"

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
        GeneratePersonalProjectMilestonesModule.register({
            isGlobal: true,
        }),
    ],
})
export class ProcessorsModule extends ConfigurableModuleClass {}
