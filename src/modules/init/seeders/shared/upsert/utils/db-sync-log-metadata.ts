import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    MilestoneEntity,
    MilestoneTaskEntity,
    ModuleEntity,
    QuizDeckEntity,
} from "@modules/databases"
import type {
    DbSyncLogDisplayFields,
    DbSyncLogEntityShape,
} from "../types/db-sync-log"

/**
 * Display id for log output: `displayId` column or stringified `orderIndex`.
 *
 * @param entity - Parsed or loaded row partial.
 */
const resolveDisplayId = (
    entity: DbSyncLogEntityShape,
): string => {
    if (typeof entity.displayId === "string" && entity.displayId.length > 0) {
        return entity.displayId
    }
    if (entity.orderIndex !== undefined && entity.orderIndex !== null) {
        return String(entity.orderIndex)
    }
    return ""
}

/**
 * Pushes defined display id strings onto the output list.
 *
 * @param ids - Candidate display ids.
 * @returns Filtered list preserving order.
 */
const relativeIds = (
    ...ids: Array<string | undefined>
): Array<string> => ids.filter((id): id is string => Boolean(id))

/**
 * Builds verbose DB sync log display fields from a seed/DB row partial.
 *
 * @param entityKind - TypeORM entity class name.
 * @param entity     - Row partial (may include parent stubs from parsers).
 * @returns `displayId`, `relativeDisplayIds`, optional `isLegacy`.
 */
export const buildDbSyncLogDisplayFields = (
    entityKind: string,
    entity: DbSyncLogEntityShape,
): DbSyncLogDisplayFields => {
    const displayId = resolveDisplayId(entity)
    switch (entityKind) {
    case CourseEntity.name:
        return {
            displayId,
            relativeDisplayIds: [],
        }
    case ModuleEntity.name:
        return {
            displayId,
            relativeDisplayIds: relativeIds(
                entity.course?.displayId,
            ),
        }
    case ContentEntity.name:
        return {
            displayId,
            relativeDisplayIds: relativeIds(
                entity.module?.course?.displayId,
                entity.module?.displayId,
            ),
            ...(entity.verified == null ? {
                isLegacy: true,
            } : {
            }),
        }
    case ChallengeEntity.name:
        return {
            displayId,
            relativeDisplayIds: relativeIds(
                entity.content?.module?.course?.displayId,
                entity.content?.displayId,
                entity.content?.module?.displayId,
            ),
            ...(entity.verified == null ? {
                isLegacy: true,
            } : {
            }),
        }
    case MilestoneEntity.name:
        return {
            displayId,
            relativeDisplayIds: relativeIds(
                entity.course?.displayId,
            ),
        }
    case MilestoneTaskEntity.name:
        return {
            displayId,
            relativeDisplayIds: relativeIds(
                entity.milestone?.course?.displayId,
                entity.milestone?.orderIndex !== undefined
                    ? String(entity.milestone.orderIndex)
                    : undefined,
            ),
        }
    case QuizDeckEntity.name:
        return {
            displayId,
            relativeDisplayIds: relativeIds(
                entity.course?.displayId,
            ),
        }
    default:
        return {
            displayId,
            relativeDisplayIds: [],
        }
    }
}
