import type {
    MilestoneEntity,
} from "@modules/databases"

/** Cached milestone list for a user's enrollment in a course. */
export type EnrollmentMilestonesCacheResult = Array<MilestoneEntity>
