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
    ReviewMilestoneTaskModule,
} from "./review-milestone-task"
import {
    ProcessGitSubmissionModule 
} from "./process-git-submission"
import {
    ProcessGoogleDocsSubmissionModule 
} from "./process-google-docs-submission"
import {
    ReviewCvSubmissionModule,
} from "./review-cv-submission"

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
        ReviewMilestoneTaskModule.register({
            isGlobal: true,
        }),
        ReviewCvSubmissionModule.register({
            isGlobal: true,
        }),
        ProcessGitSubmissionModule.register({
            isGlobal: true,
        }),
        ProcessGoogleDocsSubmissionModule.register({
            isGlobal: true,
        }),
    ],
})
export class ProcessorsModule extends ConfigurableModuleClass {}
