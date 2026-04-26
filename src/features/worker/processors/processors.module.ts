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
import {
    SendMailModule,
} from "./send-mail"
import {
    ProcessCvSubmissionModule,
} from "./process-cv-submission"
import {
    ProcessGoogleDocsSubmissionModule,
} from "./process-google-docs-submission"
import {
    SyncEmailBloomFilterModule,
} from "@features/synchronizer/processors/sync-email-bloom-filter"
import {
    SyncCdnModule,
} from "@features/synchronizer/processors/sync-cdn"
import {
    SyncElasticsearchModule,
} from "@features/synchronizer/processors/sync-elasticsearch"

/**
 * Module for the processors.
 */
@Module({
    imports: [
        SyncCdnModule.register(
            {
                isGlobal: true,
            }
        ),
        SyncElasticsearchModule.register(
            {
                isGlobal: true,
            }
        ),
        SyncEmailBloomFilterModule.register(
            {
                isGlobal: true,
            }
        ),
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
        SendMailModule.register(
            {
                isGlobal: true,
            }
        ),
        ProcessCvSubmissionModule.register(
            {
                isGlobal: true,
            }
        ),
        ProcessGoogleDocsSubmissionModule.register(
            {
                isGlobal: true,
            }
        ),
    ],
})
export class ProcessorsModule extends ConfigurableModuleClass {}
