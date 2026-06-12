import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    MilestoneTaskEntity,
    ModuleEntity,
} from "@modules/databases"
import type {
    SyncSuccessLogPayload,
} from "../types"

/**
 * `true` when entity uses legacy mount (SCHEMA V2 marks `verified` non-null).
 *
 * @param verified - Parsed `verified` column from DB.
 */
const isLegacyMount = (
    verified: Date | null | undefined,
): boolean => verified == null

/**
 * Builds verbose sync success log fields for a course row.
 *
 * @param course - Loaded course entity.
 * @returns Log payload.
 */
export const buildCourseSyncSuccessLog = (
    course: CourseEntity,
): SyncSuccessLogPayload => ({
    entityKind: CourseEntity.name,
    entityId: course.id,
    displayId: course.displayId,
    relativeDisplayIds: [],
})

/**
 * Builds verbose sync success log fields for a module row.
 *
 * @param module - Loaded module with `course` relation.
 * @returns Log payload.
 */
export const buildModuleSyncSuccessLog = (
    module: ModuleEntity,
): SyncSuccessLogPayload => ({
    entityKind: ModuleEntity.name,
    entityId: module.id,
    displayId: module.displayId,
    relativeDisplayIds: [
        module.course?.displayId ?? "",
    ].filter((id) => id.length > 0),
})

/**
 * Builds verbose sync success log fields for a content row.
 *
 * @param content - Loaded content with `module.course` relations.
 * @returns Log payload.
 */
export const buildContentSyncSuccessLog = (
    content: ContentEntity,
): SyncSuccessLogPayload => ({
    entityKind: ContentEntity.name,
    entityId: content.id,
    displayId: content.displayId,
    relativeDisplayIds: [
        content.module?.course?.displayId,
        content.module?.displayId,
    ].filter((id): id is string => Boolean(id)),
    ...(isLegacyMount(content.verified) ? {
        isLegacy: true,
    } : {
    }),
})

/**
 * Builds verbose sync success log fields for a challenge row.
 *
 * @param challenge - Loaded challenge with `content.module.course` relations.
 * @returns Log payload.
 */
export const buildChallengeSyncSuccessLog = (
    challenge: ChallengeEntity,
): SyncSuccessLogPayload => ({
    entityKind: ChallengeEntity.name,
    entityId: challenge.id,
    displayId: challenge.displayId,
    relativeDisplayIds: [
        challenge.content?.module?.course?.displayId,
        challenge.content?.displayId,
        challenge.content?.module?.displayId,
    ].filter((id): id is string => Boolean(id)),
    ...(isLegacyMount(challenge.verified) ? {
        isLegacy: true,
    } : {
    }),
})

/**
 * Builds verbose sync success log fields for a milestone task row.
 *
 * @param task - Loaded milestone task with `milestone.course` relations.
 * @returns Log payload.
 */
export const buildMilestoneTaskSyncSuccessLog = (
    task: MilestoneTaskEntity,
): SyncSuccessLogPayload => ({
    entityKind: MilestoneTaskEntity.name,
    entityId: task.id,
    // Milestone tasks have no mount slug / displayId — fall back to the primary key
    // so the log payload always carries a stable identifier.
    displayId: task.id,
    relativeDisplayIds: [
        task.milestone?.course?.displayId,
    ].filter((id): id is string => Boolean(id)),
    ...(isLegacyMount(task.verified) ? {
        isLegacy: true,
    } : {
    }),
})
