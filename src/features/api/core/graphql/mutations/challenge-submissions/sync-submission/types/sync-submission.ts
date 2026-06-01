import type {
    AiMode,
    ModelProvider,
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
    /** Submission URL to store; omit to leave it untouched (sync selection only). */
    url?: string
    /** Grading lane to persist; omit to leave untouched. */
    selectedMode?: AiMode
    /** Concrete model name to persist; omit to leave untouched. */
    selectedModel?: string
    /** Provider serving the persisted model; omit to leave untouched. */
    selectedModelProvider?: ModelProvider
    /** Optional one-shot BYOK key when syncing BYOK lane. */
    byokApiKey?: string
}
