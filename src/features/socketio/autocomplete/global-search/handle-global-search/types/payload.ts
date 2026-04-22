import {
    CourseEntity,
    ModuleEntity,
    LessonVideoEntity,
    ChallengeEntity,
    ContentEntity,
} from "@modules/databases"
import {
    SocketIoPayload 
} from "@modules/socketio"

export type SearchableEntity =
    typeof CourseEntity.name |
    typeof ModuleEntity.name |
    typeof LessonVideoEntity.name |
    typeof ChallengeEntity.name |
    typeof ContentEntity.name

/** Params for executing a global fuzzy search. */
export type GlobalSearchSocketIoPayload = SocketIoPayload<{
    query: string
    entities: Array<SearchableEntity>
    size?: number
}>
