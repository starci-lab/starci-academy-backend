import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./processors.module-definition"
import {
    SendMailModule,
} from "./send-mail/send-mail.module"
import {
    ResolveGithubModule,
} from "./resolve-github/resolve-github.module"
import {
    RevokeGithubModule,
} from "./revoke-github/revoke-github.module"
import {
    ReviewMilestoneTaskModule,
} from "./ai/review-milestone-task/review-milestone-task.module"
import {
    ProcessGitSubmissionModule,
} from "./ai/process-git-submission/process-git-submission.module"
import {
    ProcessGoogleDocsSubmissionModule,
} from "./ai/process-google-docs-submission/process-google-docs-submission.module"
import {
    JudgeCodingSubmissionModule,
} from "./judge-coding-submission/judge-coding-submission.module"
import {
    ReconcileTransactionModule,
} from "./reconcile-transaction/reconcile-transaction.module"
import {
    EnrollModule,
} from "./enroll/enroll.module"
import {
    GenerateCvModule,
} from "./ai/generate-cv/generate-cv.module"
import {
    ScoreUploadedCvModule,
} from "./ai/score-uploaded-cv/score-uploaded-cv.module"
import {
    GradeMockInterviewSessionProcessorModule,
} from "./ai/grade-mock-interview-session/grade-mock-interview-session.module"

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
        GenerateCvModule.register({
            isGlobal: true,
        }),
        // WF-07 upload-scoring processor: single-step worker that grades an
        // uploaded `cv_generations` row via the shared `ScoreUploadedCvService`
        // (injected from the global GenerateCvModule) + its enqueue service.
        ScoreUploadedCvModule.register({
            isGlobal: true,
        }),
        GradeMockInterviewSessionProcessorModule,
    ],
})
/**
 * Module for API-side BullMQ processors.
 */
export class ProcessorsModule extends ConfigurableModuleClass {}
