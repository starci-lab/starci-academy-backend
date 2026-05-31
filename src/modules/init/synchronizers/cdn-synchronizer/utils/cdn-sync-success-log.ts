import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    ModuleEntity,
} from "@modules/databases"
import type {
    CdnSyncSuccessLogPayload,
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
 * Builds verbose CDN sync success log fields for a course row.
 *
 * @param course - Loaded course entity.
 * @returns Log payload.
 */
export const buildCourseCdnSyncSuccessLog = (
    course: CourseEntity,
): CdnSyncSuccessLogPayload => ({
    entityKind: CourseEntity.name,
    entityId: course.id,
    displayId: course.displayId,
    relativeDisplayIds: [],
})

/**
 * Builds verbose CDN sync success log fields for a module row.
 *
 * @param module - Loaded module with `course` relation.
 * @returns Log payload.
 */
export const buildModuleCdnSyncSuccessLog = (
    module: ModuleEntity,
): CdnSyncSuccessLogPayload => ({
    entityKind: ModuleEntity.name,
    entityId: module.id,
    displayId: module.displayId,
    relativeDisplayIds: [
        module.course?.displayId ?? "",
    ].filter((id) => id.length > 0),
})

/**
 * Builds verbose CDN sync success log fields for a content row.
 *
 * @param content - Loaded content with `module.course` relations.
 * @returns Log payload.
 */
export const buildContentCdnSyncSuccessLog = (
    content: ContentEntity,
): CdnSyncSuccessLogPayload => ({
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
 * Builds verbose CDN sync success log fields for a challenge row.
 *
 * @param challenge - Loaded challenge with `content.module.course` relations.
 * @returns Log payload.
 */
export const buildChallengeCdnSyncSuccessLog = (
    challenge: ChallengeEntity,
): CdnSyncSuccessLogPayload => ({
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
