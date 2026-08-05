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
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    SocketIoPayload,
} from "@modules/platform/socketio/types/ws-payload"

/**
 * Entity class-name union the client may request -- anything outside these four
 * has no autocomplete index and would 404 ES or return an empty group.
 */
export type SearchableEntity =
    typeof CourseEntity.name |
    typeof ModuleEntity.name |
    typeof ChallengeEntity.name |
    typeof ContentEntity.name

/** Params for executing a global fuzzy search. */
export type GlobalSearchSocketIoPayload = SocketIoPayload<{
    query: string
    entities: Array<SearchableEntity>
    size?: number
}>
