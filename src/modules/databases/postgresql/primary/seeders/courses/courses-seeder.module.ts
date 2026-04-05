import {
    Module,
} from "@nestjs/common"
import {
    CryptoModule,
} from "@modules/crypto"
import {
    ExtractBlockService,
    ExtractBulletListItemsService,
    ExtractQnaItemsService,
    ExtractReferencesService,
    ExtractStepsService,
    ExtractSubmissionsService,
} from "./extracts"
import {
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
} from "./id-factories"
import {
    ChallengeParserService,
    ContentParserService,
    CourseParserService,
    LessonVideoParserService,
    ModuleParserService,
} from "./parsers"
import {
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
} from "./updaters"

const COURSE_SEED_PROVIDERS = [
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
] as const

@Module({
    imports: [
        CryptoModule.register(
            {
            }
        ),
    ],
    providers: [
        ...COURSE_SEED_PROVIDERS,
    ],
    exports: [
        ...COURSE_SEED_PROVIDERS,
    ],
})
export class CoursesSeederModule {
}
