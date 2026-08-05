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
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    Dayjs
} from "dayjs"

/** Entity kinds supported by on-demand CDN sync (S3 / static JSON). */
export type SyncCdnEntityKind =
    typeof CourseEntity.name
    | typeof ChallengeEntity.name
    | typeof ContentEntity.name
    | typeof ModuleEntity.name
    | typeof MilestoneTaskEntity.name

/** Payload for a sync-cdn BullMQ job (one entity). */
export interface SyncCdnPayload {
    /** Entity kind that determines which runtime sync service to invoke. */
    entityKind: SyncCdnEntityKind
    /** The timestamp of the sync. */
    syncAt: Dayjs
}
