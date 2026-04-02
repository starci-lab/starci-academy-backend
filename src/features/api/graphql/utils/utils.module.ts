import {
    DynamicModule, 
    Module,
    Provider,
} from "@nestjs/common"
import {
    ConfigurableModuleClass 
} from "./utils.module-definition"
import {
    ChallengeTransformerService,
} from "./challenge-transformer.service"
import {
    ContentTransformerService,
} from "./content-transformer.service"
import {
    CourseTransformerService
} from "./course-transformer.service"
import {
    LessonVideoTransformerService,
} from "./lesson-video-transformer.service"
import {
    ModuleTransformerService,
} from "./module-transformer.service"
import {
    PrerequisiteTransformerService,
} from "./prerequisite-transformer.service"
import {
    PreviewContentTransformerService,
} from "./preview-content-transformer.service"
import {
    QnaTransformerService,
} from "./qna-transformer.service"
import {
    ValuePropositionTransformerService,
} from "./value-proposition-transformer.service"
import {
    OPTIONS_TYPE,
} from "./utils.module-definition"

/**
 * Module for the GraphQL.
 */
@Module({
})
export class UtilsModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const dynamicModule = super.register(options)
        const providers: Array<Provider> = [
            ContentTransformerService,
            LessonVideoTransformerService,
            ChallengeTransformerService,
            PreviewContentTransformerService,
            PrerequisiteTransformerService,
            ValuePropositionTransformerService,
            QnaTransformerService,
            ModuleTransformerService,
            CourseTransformerService,
        ]
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                ...providers,
            ],
            exports: [
                ...(dynamicModule.exports ?? []),
                ...providers,
            ],
        }
    }
}
