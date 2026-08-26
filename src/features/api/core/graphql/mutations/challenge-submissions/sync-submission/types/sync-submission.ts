import type {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
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

/** Revision returned after a recoverable draft sync. */
export interface SyncSubmissionResult {
    draftRevision: number
    savedAt: Date | null
}

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
    /** Last revision observed by the caller. */
    expectedDraftRevision?: number
}

/** Params to resolve-or-create the user challenge submission row being synced. */
export interface ResolveOrCreateUserChallengeSubmissionParams {
    /** Transaction-scoped entity manager. */
    entityManager: EntityManager
    /** Authenticated user. */
    user: UserEntity
    /** Challenge submission id. */
    challengeSubmissionId: string
    /** Whether a non-empty `url` was actually sent (a selection-only sync omits it). */
    hasUrl: boolean
    /** Submission URL to store when `hasUrl`; ignored otherwise. */
    url: string | undefined
    /** The user's trial enrollment for the owning course, or `null` when unresolved. */
    enrollment: EnrollmentEntity | null
}

/** Params to persist the caller's grading model/provider selection, when provided. */
export interface ApplySelectedGradingLaneParams {
    /** The user the grading lane is validated for. */
    userId: string
    /** Concrete model name to persist; omit to leave untouched. */
    selectedModel?: string
    /** Provider serving the persisted model; omit to leave untouched. */
    selectedModelProvider?: ModelProvider
}
