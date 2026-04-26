import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    LessonVideoEntity,
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

/** Payload for a sync-elasticsearch BullMQ job (one entity by id). */
export interface SyncElasticsearchPayload {
    entityKind: SyncElasticsearchEntityKind
    /** Primary key of the source row to index. */
    id: string
    syncAt: Dayjs
}
