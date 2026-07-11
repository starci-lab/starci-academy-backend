import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    StartFlashcardDueReviewSessionRequest,
} from "./graphql-types"

export class StartFlashcardDueReviewSessionCommand {
    constructor(
        readonly params: ExecuteParams<StartFlashcardDueReviewSessionRequest>,
    ) { }
}
