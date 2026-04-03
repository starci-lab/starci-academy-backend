import type {
    UserEntity,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"
import type {
    SyncSubmissionsRequest,
} from "../graphql-types"
import type {
    ExecuteParams,
} from "../../../../../types"

/** Params for `SyncSubmissionsService.execute`. */
export type SyncSubmissionsParams =
    ExecuteParams<SyncSubmissionsRequest>

/** Result of `SyncSubmissionsService.execute`. */
export type SyncSubmissionsResult = void

/** Params for upserting one user challenge submission row. */
export interface UpsertSubmissionParams {
    /** Transaction-scoped entity manager. */
    entityManager: EntityManager
    /** Authenticated user. */
    user: UserEntity
    /** Challenge submission id. */
    challengeSubmissionId: string
    /** Submission URL to store. */
    url: string
}
