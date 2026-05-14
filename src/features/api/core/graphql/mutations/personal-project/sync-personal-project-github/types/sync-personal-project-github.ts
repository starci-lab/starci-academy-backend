import type {
    UserEntity,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"
import type {
    SyncPersonalProjectGithubRequest,
} from "../graphql-types"
import type {
    ExecuteParams,
} from "../../../../../types"

/** Params for `SyncPersonalProjectGithubService.execute`. */
export type SyncPersonalProjectGithubParams =
    ExecuteParams<SyncPersonalProjectGithubRequest>

/** Result of `SyncPersonalProjectGithubService.execute`. */
export type SyncPersonalProjectGithubResult = void

/** Params for upserting personal project GitHub fields on enrollment. */
export interface UpsertPersonalProjectGithubParams {
    /** Transaction-scoped entity manager. */
    entityManager: EntityManager
    /** Authenticated user. */
    user: UserEntity
    /** Course id. */
    courseId: string
    /** Request payload (at least one of URL / branch must be provided; branch-only requires a stored URL). */
    request: SyncPersonalProjectGithubRequest
}
