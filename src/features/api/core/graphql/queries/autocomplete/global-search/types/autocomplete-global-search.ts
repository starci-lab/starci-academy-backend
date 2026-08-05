import type {
    Locale,
    UserEntity,
} from "@modules/databases"
import type {
    ExecuteParams,
} from "@features/api/core/types"
import type {
    AutocompleteGlobalSearchRequest,
} from "../graphql-types"
import type {
    SearchableEntity,
} from "./entity-search"
import type {
    GlobalSearchItem,
    GlobalSearchMessage,
} from "./message"

/** Minimal socket client shape required by the global-search handler. */
export interface AutocompleteGlobalSearchClientData {
    userId?: string
}

/** Minimal socket client shape required by the global-search handler. */
export interface AutocompleteGlobalSearchClient {
    data?: AutocompleteGlobalSearchClientData
}

/** Params for building a Socket.IO payload for global search. */
export interface BuildAutocompleteGlobalSearchPayloadParams {
    request: AutocompleteGlobalSearchRequest
    locale: Locale
}

/** Result of building a Socket.IO payload for global search. */
export interface BuildAutocompleteGlobalSearchPayloadResult {
    locale: Locale
    data: {
        query: string
        entities: Array<SearchableEntity>
        size?: number
    }
}

/** Params for executing the global search autocomplete query. */
export type AutocompleteGlobalSearchExecuteParams =
    ExecuteParams<AutocompleteGlobalSearchRequest> & {
        /** Undefined for guests -- the query is public (free courses/challenges are searchable by anyone). */
        user?: UserEntity
    }

/** Result of global search autocomplete query. */
export type AutocompleteGlobalSearchExecuteResult = GlobalSearchMessage

/** Params for hydrating the parent-path of one entity bucket from the parent-index cache. */
export interface AttachParentPathsParams {
    /** The deduped hits of a single entity kind to enrich in place. */
    items: Array<GlobalSearchItem>
    /** The entity class name used as the parent-index cache namespace. */
    entityName: SearchableEntity
}

/** Params for enriching course + content hits with state flags (enrolled/free/premium). */
export interface AttachStateFlagsParams {
    /** Course hits to enrich with `isEnrolled` + `isFree`. */
    courses: Array<GlobalSearchItem>
    /** Content (lesson) hits to enrich with `isPremium`. */
    contents: Array<GlobalSearchItem>
    /** Undefined for guests -- used to compute per-course `isEnrolled` (false for guests). */
    user?: UserEntity
}

/** Result of enriching course + content hits with state flags. */
export interface AttachStateFlagsResult {
    /** Course hits carrying `isEnrolled` + `isFree`. */
    courses: Array<GlobalSearchItem>
    /** Content hits carrying `isPremium`. */
    contents: Array<GlobalSearchItem>
}

