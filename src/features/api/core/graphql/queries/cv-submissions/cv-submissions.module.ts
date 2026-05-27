import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./cv-submissions.module-definition"
import {
    UserCvSubmissionAttemptsSingleQueryModule,
} from "./user-cv-submission-attempts"
import {
    TemplateCvsSingleQueryModule,
} from "./template-cvs"
import {
    CvUrlSingleQueryModule,
} from "./cv-url"

/**
 * Module for CV submission related queries.
 */
@Module({
    imports: [
        UserCvSubmissionAttemptsSingleQueryModule.register({
            isGlobal: true,
        }),
        TemplateCvsSingleQueryModule.register({
            isGlobal: true,
        }),
        CvUrlSingleQueryModule.register({
            isGlobal: true,
        }),
    ],

})
export class CvSubmissionsQueriesModule extends ConfigurableModuleClass {}
