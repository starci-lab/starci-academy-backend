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
import {
    MyCourseOutlineSingleQueryModule,
} from "./my-course-outline"

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
