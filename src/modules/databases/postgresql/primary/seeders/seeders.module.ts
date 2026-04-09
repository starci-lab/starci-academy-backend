import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ChallengeIdFactoryService,
    ChallengeSubmissionPromptIdFactoryService,
    ChallengeReferenceIdFactoryService,
    ChallengeStepIdFactoryService,
    ChallengeSubmissionIdFactoryService,
    ContentIdFactoryService,
    ContentReferenceIdFactoryService,
    CourseIdFactoryService,
    LessonVideoIdFactoryService,
    LivestreamSessionIdFactoryService,
    ModuleIdFactoryService,
    PrerequisiteIdFactoryService,
    PreviewContentIdFactoryService,
    PricingPhaseIdFactoryService,
    QnaIdFactoryService,
    ValuePropositionIdFactoryService,
    ChallengeParserService,
    ContentParserService,
    CourseParserService,
    LessonVideoParserService,
    ModuleParserService,
    ChallengeDirService,
    ContentDirService,
    CourseDirService,
    LessonVideoDirService,
    ModuleDirService,
    ExtractJsonFromMdService,
    CoerceMdScalarService,
} from "./courses"
import {
    SeedersService 
} from "./seeders.service"
import {
    ConfigurableModuleClass, OPTIONS_TYPE 
} from "./seeders.module-definition"

/**
 * Module for the Seeders.
 */
@Module({
})
export class SeedersModule extends ConfigurableModuleClass {
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const providers = [
            ExtractJsonFromMdService,
            CoerceMdScalarService,
            CourseDirService,
            ModuleDirService,
            ContentDirService,
            LessonVideoDirService,
            ChallengeDirService,
            CourseIdFactoryService,
            ModuleIdFactoryService,
            ContentIdFactoryService,
            ContentReferenceIdFactoryService,
            PreviewContentIdFactoryService,
            PricingPhaseIdFactoryService,
            ValuePropositionIdFactoryService,
            PrerequisiteIdFactoryService,
            QnaIdFactoryService,
            LessonVideoIdFactoryService,
            LivestreamSessionIdFactoryService,
            ChallengeIdFactoryService,
            ChallengeStepIdFactoryService,
            ChallengeReferenceIdFactoryService,
            ChallengeSubmissionIdFactoryService,
            ChallengeSubmissionPromptIdFactoryService,
            CourseParserService,
            ModuleParserService,
            ContentParserService,
            LessonVideoParserService,
            ChallengeParserService,
        ]
        const dynamicModule = super.register(options)
        return {
            ...dynamicModule,
            providers: [
                ...dynamicModule.providers ?? [],
                ...providers,
                SeedersService
            ],
            exports: [
                ...providers,
            ],
        }
    }
}
