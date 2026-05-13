import {
    Module,
} from "@nestjs/common"
import {
    S3Module,
} from "@modules/s3"
import {
    MixinModule,
} from "@modules/mixin"
import {
    ConfigurableModuleClass 
} from "./cv-submissions.module-definition"
import {
    UserCvSubmissionAttemptsHistoryModule,
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
        S3Module,
        MixinModule,
        UserCvSubmissionAttemptsHistoryModule.register({
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
