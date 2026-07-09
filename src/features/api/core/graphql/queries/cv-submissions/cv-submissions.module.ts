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
import {
    CvGenerationSingleQueryModule,
} from "./cv-generation"
import {
    MyCvGenerationsSingleQueryModule,
} from "./my-cv-generations"
import {
    MyPickableCvAchievementsSingleQueryModule,
} from "./my-pickable-cv-achievements"
import {
    MyCvBlocksSingleQueryModule,
} from "./my-cv-blocks"

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
        CvGenerationSingleQueryModule.register({
            isGlobal: true,
        }),
        MyCvGenerationsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyPickableCvAchievementsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyCvBlocksSingleQueryModule.register({
            isGlobal: true,
        }),
    ],

})
export class CvSubmissionsQueriesModule extends ConfigurableModuleClass {}
