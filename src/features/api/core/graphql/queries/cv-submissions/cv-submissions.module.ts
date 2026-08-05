import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass
} from "./cv-submissions.module-definition"
import {
    TemplateCvsSingleQueryModule,
} from "./template-cvs/template-cvs.module"
import {
    CvGenerationSingleQueryModule,
} from "./cv-generation/cv-generation.module"
import {
    MyCvGenerationsSingleQueryModule,
} from "./my-cv-generations/my-cv-generations.module"
import {
    MyPickableCvAchievementsSingleQueryModule,
} from "./my-pickable-cv-achievements/my-pickable-cv-achievements.module"
import {
    MyCvBlocksSingleQueryModule,
} from "./my-cv-blocks/my-cv-blocks.module"

@Module({
    imports: [
        TemplateCvsSingleQueryModule.register({
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
/**
 * Module for CV submission related queries.
 */
export class CvSubmissionsQueriesModule extends ConfigurableModuleClass {}
