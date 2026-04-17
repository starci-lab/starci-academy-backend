import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./processors.module-definition"
import {
    EnrollModule,
} from "./enroll"
import {
    ProcessGitSubmissionModule,
} from "./process-git-submission"
import {
    InviteGithubModule,
} from "./invite-github"

/**
 * Module for the processors.
 */
@Module({
    imports: [
        EnrollModule.register(
            {
                isGlobal: true,
            }
        ),
        ProcessGitSubmissionModule.register(
            {
                isGlobal: true,
            }
        ),
        InviteGithubModule.register(
            {
                isGlobal: true,
            }
        ),
    ],
})
export class ProcessorsModule extends ConfigurableModuleClass {}
