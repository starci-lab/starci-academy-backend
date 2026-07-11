import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SyncFlashcardDueReviewSessionProgressRequest,
} from "./graphql-types"

export class SyncFlashcardDueReviewSessionProgressCommand {
    constructor(
        readonly params: ExecuteParams<SyncFlashcardDueReviewSessionProgressRequest>,
    ) { }
}
