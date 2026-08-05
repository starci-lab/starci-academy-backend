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
} from "./enqueue"
import {
    JobActionService,
    JobStalledService
} from "./atomic"
import {
    InstallmentPlanModule,
} from "../installment-plan"

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
