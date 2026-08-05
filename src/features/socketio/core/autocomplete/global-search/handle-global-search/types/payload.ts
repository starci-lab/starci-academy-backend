import {
    CourseEntity,
    ModuleEntity,
    ChallengeEntity,
    ContentEntity,
} from "@modules/databases"
import {
    SocketIoPayload,
} from "@modules/socketio"

/**
 * Entity class-name union the client may request — anything outside these four
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
