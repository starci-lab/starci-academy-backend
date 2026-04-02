import {
    Module 
} from "@nestjs/common"
import {
    SeedersService 
} from "./seeders.service"
import {
    ConfigurableModuleClass 
} from "./seeders.module-definition"
import {
    CoursesService,
} from "./courses"
import {
    QnaService,
} from "./courses/qna.service"
import {
    PreviewContentService,
} from "./courses/preview-content.service"
import {
    PrerequisiteService,
} from "./courses/prerequisite.service"
import {
    ContentService,
} from "./courses/content.service"
import {
    ContentReferenceService,
} from "./courses/content-reference.service"
import {
    LessonVideoService,
} from "./courses/lesson-video.service"
import {
    ChallengeInputService,
} from "./courses/challenge-input.service"
import {
    ChallengeStepService,
} from "./courses/challenge-step.service"
import {
    ChallengeReferenceService,
} from "./courses/challenge-reference.service"
import {
    ChallengeService,
} from "./courses/challenge.service"
import {
    ModuleService,
} from "./courses/module.service"
import {
    PricingPhaseService,
} from "./courses/pricing-phase.service"
import {
    ValuePropositionService,
} from "./courses/value-proposition.service"
/**
 * The module for the Seeders.
 */
@Module({
    providers: [
        SeedersService,
        CoursesService,
        QnaService,
        PreviewContentService,
        PrerequisiteService,
        ContentService,
        ContentReferenceService,
        LessonVideoService,
        ChallengeInputService,
        ChallengeStepService,
        ChallengeReferenceService,
        ChallengeService,
        ModuleService,
        PricingPhaseService,
        ValuePropositionService,
    ],
    exports: [
        SeedersService,
        CoursesService,
        QnaService,
        PreviewContentService,
        PrerequisiteService,
        ContentService,
        ContentReferenceService,
        LessonVideoService,
        ChallengeInputService,
        ChallengeStepService,
        ChallengeReferenceService,
        ChallengeService,
        ModuleService,
        PricingPhaseService,
        ValuePropositionService,
    ]
})
export class SeedersModule extends ConfigurableModuleClass {
}