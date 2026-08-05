import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import type {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import type {
    EntityManager,
} from "typeorm"
import type {
    SyncSubmissionRequest,
} from "../graphql-types/request"
import type {
    ExecuteParams,
} from "../../../../../types/execute"

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
    /** Concrete model name to persist; omit to leave untouched. */
    selectedModel?: string
    /** Provider serving the persisted model; omit to leave untouched. */
    selectedModelProvider?: ModelProvider
}
