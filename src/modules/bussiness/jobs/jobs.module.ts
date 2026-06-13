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
    EnqueueProcessGitSubmissionJobService,
    EnqueueProcessGitSubmissionV2JobService,
    EnqueueProcessGoogleDocsSubmissionJobService,
    EnqueueProcessGoogleDocsSubmissionV2JobService,
    EnqueueResolveGithubJobService,
    EnqueueProcessCvSubmissionJobService,
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
    EnqueueReviewAiLabEvalJobService,
} from "./enqueue"
import {
    JobActionService, 
    JobStalledService 
} from "./atomic"

/**
 * Module for job management.
 */
@Module({
})
export class JobsModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                JobActionService,
                JobStalledService,
                EnqueueEnrollJobService,
                EnqueueProcessGitSubmissionJobService,
                EnqueueProcessGitSubmissionV2JobService,
                EnqueueProcessGoogleDocsSubmissionJobService,
                EnqueueProcessGoogleDocsSubmissionV2JobService,
                EnqueueResolveGithubJobService,
                EnqueueProcessCvSubmissionJobService,
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
                EnqueueReviewAiLabEvalJobService,
            ],
            exports: [
                JobActionService,
                JobStalledService,
                EnqueueEnrollJobService,
                EnqueueProcessGitSubmissionJobService,
                EnqueueProcessGitSubmissionV2JobService,
                EnqueueProcessGoogleDocsSubmissionJobService,
                EnqueueProcessGoogleDocsSubmissionV2JobService,
                EnqueueResolveGithubJobService,
                EnqueueProcessCvSubmissionJobService,
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
                EnqueueReviewAiLabEvalJobService,
            ],
        }
    }
}
