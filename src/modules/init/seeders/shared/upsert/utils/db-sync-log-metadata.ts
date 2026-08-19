import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
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
    case ModuleEntity.name:
    case MilestoneEntity.name:
    case FlashcardDeckEntity.name:
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
    case CourseEntity.name:
    default:
        return {
            displayId,
            relativeDisplayIds: [],
        }
    }
}
