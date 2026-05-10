import type {
    PersonalProjectTaskEntity,
} from "@modules/databases"

/** Cached task list for a user's enrollment in a course. */
export type EnrollmentMilestonesCacheResult = Array<PersonalProjectTaskEntity>
