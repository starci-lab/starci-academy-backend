import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./learner-cms.module-definition"
import {
    ChallengeSubmissionsCmsService,
} from "./challenge-submissions-cms.service"
import {
    MilestoneTaskAttemptsCmsService,
} from "./milestone-task-attempts-cms.service"
import {
    LearningFeedbacksCmsService,
} from "./learning-feedbacks-cms.service"

/**
 * Business module for the learner self-management CMS reads — three PLAIN
 * paginated lists keyed by the current user (the LIST exception: no CQRS
 * projection). Exports the three services so the GraphQL leaf resolvers can read
 * the live tables via the primary EntityManager.
 */
@Module({
    providers: [
        ChallengeSubmissionsCmsService,
        MilestoneTaskAttemptsCmsService,
        LearningFeedbacksCmsService,
    ],
    exports: [
        ChallengeSubmissionsCmsService,
        MilestoneTaskAttemptsCmsService,
        LearningFeedbacksCmsService,
    ],
})
export class LearnerCmsModule extends ConfigurableModuleClass {}
