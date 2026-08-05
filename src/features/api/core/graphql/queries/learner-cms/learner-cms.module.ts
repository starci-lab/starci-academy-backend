import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./learner-cms.module-definition"
import {
    MyChallengeSubmissionsSingleQueryModule,
} from "./my-challenge-submissions/my-challenge-submissions.module"
import {
    MyMilestoneTaskAttemptsSingleQueryModule,
} from "./my-milestone-task-attempts/my-milestone-task-attempts.module"
import {
    MyLearningFeedbacksSingleQueryModule,
} from "./my-learning-feedbacks/my-learning-feedbacks.module"
import {
    MyCourseOutlineSingleQueryModule,
} from "./my-course-outline/my-course-outline.module"

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
        MyCourseOutlineSingleQueryModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Learner self-management CMS query group -- the viewer's own paginated history:
 * challenge-submission attempts (`myChallengeSubmissions`), milestone-task review
 * attempts (`myMilestoneTaskAttempts`), merged learning feedback
 * (`myLearningFeedbacks`), and the per-course outline with progress overlaid
 * (`myCourseOutline`). The list reads are the LIST exception (no CQRS
 * projection); the outline is a read-only CQRS assembly. Each leaf is registered
 * global so its resolver is picked up by the schema.
 */
export class LearnerCmsQueriesModule extends ConfigurableModuleClass {}
