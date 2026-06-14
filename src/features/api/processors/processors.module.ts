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
    RevokeGithubModule,
} from "./revoke-github"
import {
    ReviewMilestoneTaskModule,
} from "./ai/review-milestone-task"
import {
    ProcessGitSubmissionModule,
} from "./ai/process-git-submission"
import {
    ProcessGoogleDocsSubmissionModule,
} from "./ai/process-google-docs-submission"
import {
    ReviewCvSubmissionModule,
} from "./ai/review-cv-submission"
import {
    JudgeCodingSubmissionModule,
} from "./judge-coding-submission"
import {
    ReconcileTransactionModule,
} from "./reconcile-transaction"
import {
    EnrollModule,
} from "./enroll"
import {
    ReviewAiLabEvalModule,
} from "./ai/review-ai-lab-eval"

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
        RevokeGithubModule.register({
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
        JudgeCodingSubmissionModule.register({
            isGlobal: true,
        }),
        ReconcileTransactionModule.register({
            isGlobal: true,
        }),
        EnrollModule.register({
            isGlobal: true,
        }),
        ReviewAiLabEvalModule.register({
            isGlobal: true,
        }),
    ],
})
export class ProcessorsModule extends ConfigurableModuleClass {}
