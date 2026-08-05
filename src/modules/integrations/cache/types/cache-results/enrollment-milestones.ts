import type {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"

/** Cached task list for a user's enrollment in a course. */
export type EnrollmentMilestonesCacheResult = Array<MilestoneTaskEntity>
