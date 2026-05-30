import {
    CourseEntity,
    ModuleEntity,
    ChallengeEntity,
    ContentEntity,
} from "@modules/databases"
import {
    SocketIoPayload,
} from "@modules/socketio"

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
