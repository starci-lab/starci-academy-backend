import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SyncFlashcardReviewSessionProgressRequest,
} from "./graphql-types"

export class SyncFlashcardReviewSessionProgressCommand {
    constructor(
        readonly params: ExecuteParams<SyncFlashcardReviewSessionProgressRequest>,
    ) { }
}
