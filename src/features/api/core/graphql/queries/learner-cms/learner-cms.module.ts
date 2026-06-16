import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./learner-cms.module-definition"
import {
    MyChallengeSubmissionsSingleQueryModule,
} from "./my-challenge-submissions"
import {
    MyMilestoneTaskAttemptsSingleQueryModule,
} from "./my-milestone-task-attempts"
import {
    MyLearningFeedbacksSingleQueryModule,
} from "./my-learning-feedbacks"

/**
 * Learner self-management CMS query group — the viewer's own paginated history:
 * challenge-submission attempts (`myChallengeSubmissions`), milestone-task review
 * attempts (`myMilestoneTaskAttempts`), and merged learning feedback
 * (`myLearningFeedbacks`). All are PLAIN paginated list reads keyed by the
 * current user (the LIST exception — no CQRS projection). Each leaf is registered
 * global so its resolver is picked up by the schema.
 */
@Module({
    imports: [
        MyChallengeSubmissionsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyMilestoneTaskAttemptsSingleQueryModule.register({
            isGlobal: true,
        }),
        MyLearningFeedbacksSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
export class LearnerCmsQueriesModule extends ConfigurableModuleClass {}
