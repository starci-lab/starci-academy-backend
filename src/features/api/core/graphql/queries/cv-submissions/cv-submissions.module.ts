import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./cv-submissions.module-definition"
import {
    UserCvSubmissionAttemptsModule,
} from "./user-cv-submission-attempts"
import {
    TemplateCvsQueryModule,
} from "./template-cvs"
import {
    CvUrlQueryModule,
} from "./cv-url"

/**
 * Module for CV submission related queries.
 */
@Module({
    imports: [
        UserCvSubmissionAttemptsModule.register({
            isGlobal: true,
        }),
        TemplateCvsQueryModule.register({
            isGlobal: true,
        }),
        CvUrlQueryModule.register({
            isGlobal: true,
        }),
    ],

})
export class CvSubmissionsQueriesModule extends ConfigurableModuleClass {}
