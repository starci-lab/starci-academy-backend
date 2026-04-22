import type {
    ExecuteParams,
} from "@features/socketio/types"
import type {
    GlobalSearchSocketIoPayload,
} from "./types"

/**
 * CQRS query for global fuzzy search.
 */
export class GlobalSearchQuery {
    constructor(
        public readonly params: ExecuteParams<GlobalSearchSocketIoPayload>,
    ) {}
}

