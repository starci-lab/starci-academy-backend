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
    ModuleParserService,
    ContextLoaderService,
    FilesystemContextService,
    S3ContextService,
    ExtractJsonFromMdService,
    CoerceMdScalarService,
    CoursePathService,
    ModulePathService,
    ContentPathService,
    ChallengePathService,
    PathResolverService,
} from "./courses"
import {
    SeedersService,
} from "./seeders.service"
import {
    ConfigurableModuleClass,
    OPTIONS_TYPE,
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
            LivestreamSessionIdFactoryService,
            CoursePathService,
            ModulePathService,
            ContentPathService,
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
            ChallengeParserService,
            PathResolverService
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
