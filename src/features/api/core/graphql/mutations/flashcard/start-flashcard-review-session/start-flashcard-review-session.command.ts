import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    StartFlashcardReviewSessionRequest,
} from "./graphql-types"

export class StartFlashcardReviewSessionCommand {
    constructor(
        readonly params: ExecuteParams<StartFlashcardReviewSessionRequest>,
    ) { }
}
