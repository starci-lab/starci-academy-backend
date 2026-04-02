import type {
    UserEntity,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"
import type {
    SyncSubmissionUrlsRequest,
} from "../graphql-types"
import type {
    ExecuteParams,
} from "../../../../../types"

/** Params for `SyncSubmissionUrlsService.execute`. */
export type SyncSubmissionUrlsParams =
    ExecuteParams<SyncSubmissionUrlsRequest>

/** Result of `SyncSubmissionUrlsService.execute`. */
export type SyncSubmissionUrlsResult = void

/** Params for upserting one user challenge submission row. */
export interface UpsertSubmissionUrlParams {
    /** Transaction-scoped entity manager. */
    entityManager: EntityManager
    /** Authenticated user. */
    user: UserEntity
    /** Challenge submission id. */
    challengeSubmissionId: string
    /** Submission URL to store. */
    url: string
}
