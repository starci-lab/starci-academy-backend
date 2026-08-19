import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import type {
    EntityManager,
} from "typeorm"
import type {
    SyncPersonalProjectGithubRequest,
} from "../graphql-types/request"
import type {
    ExecuteParams,
} from "../../../../../types/execute"

/** Params for `SyncPersonalProjectGithubService.execute`. */
export type SyncPersonalProjectGithubParams =
    ExecuteParams<SyncPersonalProjectGithubRequest>

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

/** Trimmed/normalized intent derived from one sync request's raw fields. */
export interface GithubSyncIntent {
    /** Trimmed GitHub URL, or `""` when not sent / not a string. */
    urlTrimmed: string
    /** Whether a non-empty URL was actually sent. */
    hasUrl: boolean
    /** Whether the client sent a `branch` field at all (vs. omitted). */
    branchProvided: boolean
    /** Trimmed branch name, or `""` when not provided. */
    branchTrimmed: string
    /** Trimmed GitHub token, or `""` when not sent / not a string. */
    tokenTrimmed: string
    /** Whether a non-empty token was actually sent. */
    hasToken: boolean
    /** Whether the client asked to clear the stored token. */
    shouldClearToken: boolean
}
