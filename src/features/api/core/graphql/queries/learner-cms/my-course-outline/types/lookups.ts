import type {
    ChallengeSubmissionProgressItem,
} from "@modules/integrations/cache/types/cache-results/challenge-submission-progress"
import type {
    MilestoneTaskProgressItem,
} from "@modules/integrations/cache/types/cache-results/milestone-task-progress"

/**
 * Per-challenge progress keyed by challenge id, built from
 * `ChallengeProgressService.getProgress(...).completionTasks`. Used to overlay
 * status / lastScore / completed onto each challenge in the course tree.
 */
export type ChallengeProgressLookup = Map<string, ChallengeSubmissionProgressItem>

/**
 * Per-milestone-task progress keyed by task id, built from
 * `PersonalProjectProgressService.getProgress(...).completionTasks`. Used to
 * overlay completed / lastScore onto each capstone task in the milestone tree.
 */
export type TaskProgressLookup = Map<string, MilestoneTaskProgressItem>

/**
 * Lesson read flags keyed by content (lesson) id. A `true` value means the
 * viewer has read that lesson; a missing key means not read.
 */
export type LessonReadLookup = Map<string, boolean>
