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
                EnqueueProcessGoogleDocsSubmissionJobService,
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
            ],
            exports: [
                JobActionService,
                JobStalledService,
                EnqueueEnrollJobService,
                EnqueueProcessGitSubmissionJobService,
                EnqueueProcessGoogleDocsSubmissionJobService,
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
            ],
        }
    }
}
