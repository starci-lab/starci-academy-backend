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
    ChallengeRequirementIdFactoryService,
    ChallengeOutputIdFactoryService,
    ChallengePrerequisiteIdFactoryService,
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
    ChallengePathService,
    UpsertService,
    CourseInsertService,
    ModuleInsertService,
    ContentInsertService,
    LessonVideoInsertService,
    ChallengeInsertService,
    MilestoneIdFactoryService,
    MilestoneTaskIdFactoryService,
    MilestoneTaskPassCriteriaIdFactoryService,
    MilestonePathService,
    MilestoneTaskPathService,
    MilestoneParserService,
    MilestoneTaskParserService,
    MilestoneInsertService,
    MilestoneTaskInsertService,
    CourseSeederService,
    ContentPathService,
    CoursePathService,
    LessonVideoPathService,
    ModulePathService,
} from "./courses"
import {
    CvSeederService,
    TemplateCvIdFactoryService,
    TemplateCvInsertService,
    TemplateCvParserService,
    TemplateCvPathService,
} from "./cv"
import {
    SeedersService,
} from "./seeders.service"
import {
    ConfigurableModuleClass, OPTIONS_TYPE 
} from "./seeders.module-definition"
import {
    ExtractJsonFromMdService, 
    CoerceMdScalarService, 
    S3ContextService, 
    FilesystemContextService, 
    ContextLoaderService, 
    PathResolverService 
} from "./shared"


/**
 * Module for the Seeders.
 * Provides all parser services and the SeedersService.
 */
@Module({
})
export class SeedersModule extends ConfigurableModuleClass {
    static register(
        options: typeof OPTIONS_TYPE
    ): DynamicModule {
        const dynamicModule = super.register(options)
        const providers = [
            ExtractJsonFromMdService,
            CoerceMdScalarService,
            S3ContextService,
            FilesystemContextService,
            ContextLoaderService,
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
            CoursePathService,
            ModulePathService,
            ContentPathService,
            LessonVideoPathService,
            ChallengePathService,
            ChallengeIdFactoryService,
            ChallengeStepIdFactoryService,
            ChallengeReferenceIdFactoryService,
            ChallengeSubmissionIdFactoryService,
            ChallengeSubmissionPromptIdFactoryService,
            ChallengeRequirementIdFactoryService,
            ChallengeOutputIdFactoryService,
            ChallengePrerequisiteIdFactoryService,
            CourseParserService,
            ModuleParserService,
            ContentParserService,
            LessonVideoParserService,
            ChallengeParserService,
            PathResolverService,
            UpsertService,
            CourseInsertService,
            ModuleInsertService,
            ContentInsertService,
            LessonVideoInsertService,
            ChallengeInsertService,
            MilestoneIdFactoryService,
            MilestoneTaskIdFactoryService,
            MilestoneTaskPassCriteriaIdFactoryService,
            MilestonePathService,
            MilestoneTaskPathService,
            MilestoneParserService,
            MilestoneTaskParserService,
            MilestoneInsertService,
            MilestoneTaskInsertService,
            CourseSeederService,
            SeedersService,
            TemplateCvPathService,
            TemplateCvIdFactoryService,
            TemplateCvParserService,
            TemplateCvInsertService,
            CvSeederService,
        ]
        
        return {
            ...dynamicModule,
            providers: [
                ...(dynamicModule.providers ?? []),
                ...providers,
            ],
            exports: providers,
        }
    }
}
