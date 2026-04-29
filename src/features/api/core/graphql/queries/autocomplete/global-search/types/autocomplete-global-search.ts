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
        user: UserEntity
    }

/** Result of global search autocomplete query. */
export type AutocompleteGlobalSearchExecuteResult = GlobalSearchMessage

