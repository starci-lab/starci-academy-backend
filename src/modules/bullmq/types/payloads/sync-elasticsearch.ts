import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    LessonVideoEntity,
    ModuleEntity,
} from "@modules/databases"
import {
    Dayjs,
} from "dayjs"

/** Entity kinds supported by on-demand Elasticsearch sync (search indices). */
export type SyncElasticsearchEntityKind =
    typeof CourseEntity.name
    | typeof ChallengeEntity.name
    | typeof ContentEntity.name
    | typeof LessonVideoEntity.name
    | typeof ModuleEntity.name

/** Payload for a sync-elasticsearch BullMQ job (one entity by id). */
export interface SyncElasticsearchPayload {
    /** Entity kind that determines which runtime sync service to invoke. */
    entityKind: SyncElasticsearchEntityKind
    /** The timestamp of the sync. */
    syncAt: Dayjs
}
