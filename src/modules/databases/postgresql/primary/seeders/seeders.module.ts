import {
    DynamicModule,
    Module,
} from "@nestjs/common"
import {
    ExtractBlockService,
    ExtractBulletListItemsService,
    ExtractQnaItemsService,
    ExtractReferencesService,
    ExtractStepsService,
    ExtractSubmissionsService,
    ChallengeIdFactoryService,
    ChallengePromptIdFactoryService,
    ChallengeReferenceIdFactoryService,
    ChallengeStepIdFactoryService,
    ChallengeSubmissionIdFactoryService,
    ContentIdFactoryService,
    ContentReferenceIdFactoryService,
    CourseIdFactoryService,
    LessonVideoIdFactoryService,
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
    ChallengePromptUpdaterService,
    ChallengeReferenceUpdaterService,
    ChallengeStepUpdaterService,
    ChallengeSubmissionUpdaterService,
    ChallengeUpdaterService,
    ContentReferenceUpdaterService,
    ContentUpdaterService,
    CoursesUpdaterService,
    LessonVideoUpdaterService,
    ModuleUpdaterService,
    PrerequisiteUpdaterService,
    PreviewContentUpdaterService,
    PricingPhaseUpdaterService,
    QnaUpdaterService,
    ValuePropositionUpdaterService,
    ChallengeDirService,
    ContentDirService,
    CourseDirService,
    LessonVideoDirService,
    ModuleDirService,
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
            CourseDirService,
            ModuleDirService,
            ContentDirService,
            LessonVideoDirService,
            ChallengeDirService,
            ExtractBlockService,
            ExtractBulletListItemsService,
            ExtractQnaItemsService,
            ExtractReferencesService,
            ExtractStepsService,
            ExtractSubmissionsService,
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
            ChallengeIdFactoryService,
            ChallengeStepIdFactoryService,
            ChallengeReferenceIdFactoryService,
            ChallengeSubmissionIdFactoryService,
            ChallengePromptIdFactoryService,
            CourseParserService,
            ModuleParserService,
            ContentParserService,
            LessonVideoParserService,
            ChallengeParserService,
            CoursesUpdaterService,
            QnaUpdaterService,
            PreviewContentUpdaterService,
            PrerequisiteUpdaterService,
            ContentUpdaterService,
            ContentReferenceUpdaterService,
            LessonVideoUpdaterService,
            ChallengeStepUpdaterService,
            ChallengeReferenceUpdaterService,
            ChallengeSubmissionUpdaterService,
            ChallengePromptUpdaterService,
            ChallengeUpdaterService,
            ModuleUpdaterService,
            PricingPhaseUpdaterService,
            ValuePropositionUpdaterService,
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
