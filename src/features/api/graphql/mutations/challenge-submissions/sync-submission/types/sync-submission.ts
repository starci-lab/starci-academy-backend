import type {
    UserEntity,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"
import type {
    SyncSubmissionRequest,
} from "../graphql-types"
import type {
    ExecuteParams,
} from "../../../../../types"

/** Params for `SyncSubmissionService.execute`. */
export type SyncSubmissionParams =
    ExecuteParams<SyncSubmissionRequest>

/** Result of `SyncSubmissionService.execute`. */
export type SyncSubmissionResult = void

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
