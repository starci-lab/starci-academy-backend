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
    ProcessCvSubmissionModule,
} from "./process-cv-submission"
import {
    ProcessGoogleDocsSubmissionModule,
} from "./process-google-docs-submission"
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
