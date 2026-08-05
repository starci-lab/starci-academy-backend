import type {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import type {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import type {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import type {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import type {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"

/** One CDN-materialized entity type + its object-key prefix (with trailing slash). */
export interface CdnTarget {
    /** Entity class -- queried for live id + displayId. */
    entity:
        | typeof CourseEntity
        | typeof ModuleEntity
        | typeof ContentEntity
        | typeof ChallengeEntity
        | typeof MilestoneTaskEntity
    /** S3/MinIO key prefix, e.g. `courses/`. */
    prefix: string
}

/** The live id and displayId sets loaded from the DB for one entity type. */
export interface ReconcileIdsResult {
    /** The live primary-key id values. */
    ids: Array<string>
    /** The live displayId values (empty unless `withDisplayId` was requested). */
    displayIds: Array<string>
}

/** One row selected by the live-columns query (id, plus optional displayId). */
export interface LiveColumnsRow {
    /** The entity primary-key id. */
    id: string
    /** The entity displayId (selected for CDN-keyed types only). */
    displayId?: string | null
}
