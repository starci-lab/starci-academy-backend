import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
} from "./jobs.module-definition"
import {
    EnqueueEnrollJobService,
} from "./enqueue/enroll.service"
import {
    EnqueueGeneratePersonalProjectTasksJobService,
} from "./enqueue/generate-personal-project-tasks.service"
import {
    EnqueueJudgeCodingSubmissionJobService,
} from "./enqueue/judge-coding-submission.service"
import {
    EnqueueProcessGitSubmissionJobService,
} from "./enqueue/process-git-submission.service"
import {
    EnqueueProcessGoogleDocsSubmissionJobService,
} from "./enqueue/process-google-docs-submission.service"
import {
    EnqueueProcessPersonalProjectJobService,
} from "./enqueue/process-personal-project.service"
import {
    EnqueueReconcileTransactionJobService,
} from "./enqueue/reconcile-transaction.service"
import {
    EnqueueResolveGithubJobService,
} from "./enqueue/resolve-github.service"
import {
    EnqueueReviewPersonalProjectTaskJobService,
} from "./enqueue/review-personal-project-task.service"
import {
    EnqueueRevokeGithubJobService,
} from "./enqueue/revoke-github.service"
import {
    EnqueueSendMailJobService,
} from "./enqueue/send-mail.service"
import {
    EnqueueSyncCdnJobService,
} from "./enqueue/sync-cdn.service"
import {
    EnqueueSyncElasticsearchJobService,
} from "./enqueue/sync-elasticsearch.service"
import {
    EnqueueSyncEmailBloomFilterJobService,
} from "./enqueue/sync-email-bloom-filter.service"
import {
    EnqueueSyncIndexerJobService,
} from "./enqueue/sync-indexer.service"
import {
    EnqueueSyncScyllaDBJobService,
} from "./enqueue/sync-scylladb.service"
import {
    JobActionService,
} from "./atomic/job-action.service"
import {
    JobStalledService,
} from "./atomic/job-stalled.service"
import {
    JobStatusReadService,
} from "./atomic/job-status-read.service"
import {
    InstallmentPlanModule,
} from "../installment-plan/installment-plan.module"

@Module({
})
/**
 * Module for job management.
 */
export class JobsModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        return {
            ...dynamicModule,
            // the enroll fan-out (EnqueueEnrollJobService) creates the Fixed
            // installment plan once per paid installment checkout
            imports: [
                ...(dynamicModule.imports ?? []),
                InstallmentPlanModule.register(options),
            ],
            providers: [
                ...(dynamicModule.providers ?? []),
                JobActionService,
                JobStalledService,
                JobStatusReadService,
                EnqueueEnrollJobService,
                EnqueueProcessGitSubmissionJobService,
                EnqueueProcessGoogleDocsSubmissionJobService,
                EnqueueResolveGithubJobService,
                EnqueueRevokeGithubJobService,
                EnqueueSendMailJobService,
                EnqueueSyncScyllaDBJobService,
                EnqueueSyncEmailBloomFilterJobService,
                EnqueueSyncIndexerJobService,
                EnqueueSyncCdnJobService,
                EnqueueSyncElasticsearchJobService,
                EnqueueProcessPersonalProjectJobService,
                EnqueueGeneratePersonalProjectTasksJobService,
                EnqueueReviewPersonalProjectTaskJobService,
                EnqueueJudgeCodingSubmissionJobService,
                EnqueueReconcileTransactionJobService,
            ],
            exports: [
                JobActionService,
                JobStalledService,
                JobStatusReadService,
                EnqueueEnrollJobService,
                EnqueueProcessGitSubmissionJobService,
                EnqueueProcessGoogleDocsSubmissionJobService,
                EnqueueResolveGithubJobService,
                EnqueueRevokeGithubJobService,
                EnqueueSendMailJobService,
                EnqueueSyncScyllaDBJobService,
                EnqueueSyncEmailBloomFilterJobService,
                EnqueueSyncIndexerJobService,
                EnqueueSyncCdnJobService,
                EnqueueSyncElasticsearchJobService,
                EnqueueProcessPersonalProjectJobService,
                EnqueueGeneratePersonalProjectTasksJobService,
                EnqueueReviewPersonalProjectTaskJobService,
                EnqueueJudgeCodingSubmissionJobService,
                EnqueueReconcileTransactionJobService,
            ],
        }
    }
}
