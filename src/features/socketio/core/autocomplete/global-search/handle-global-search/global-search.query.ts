import type {
    ExecuteParams,
} from "../../../types/execute"
import type {
    GlobalSearchSocketIoPayload,
} from "./types/payload"

/**
 * CQRS query for global fuzzy search.
 */
export class GlobalSearchQuery {
    constructor(
        public readonly params: ExecuteParams<GlobalSearchSocketIoPayload>,
    ) {}
}

