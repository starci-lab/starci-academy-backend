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
    ProcessGitSubmissionV2Module,
} from "./process-git-submission-v2"
import {
    ProcessGoogleDocsSubmissionModule
} from "./process-google-docs-submission"
import {
    ProcessGoogleDocsSubmissionV2Module,
} from "./process-google-docs-submission-v2"
import {
    ReviewCvSubmissionModule,
} from "./review-cv-submission"
import {
    JudgeCodingSubmissionModule,
} from "./judge-coding-submission"
import {
    ReconcileTransactionModule,
} from "./reconcile-transaction"
import {
    EnrollModule,
} from "./enroll"

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
        ProcessGitSubmissionV2Module.register({
            isGlobal: true,
        }),
        ProcessGoogleDocsSubmissionModule.register({
            isGlobal: true,
        }),
        ProcessGoogleDocsSubmissionV2Module.register({
            isGlobal: true,
        }),
        JudgeCodingSubmissionModule.register({
            isGlobal: true,
        }),
        ReconcileTransactionModule.register({
            isGlobal: true,
        }),
        EnrollModule.register({
            isGlobal: true,
        }),
    ],
})
export class ProcessorsModule extends ConfigurableModuleClass {}
