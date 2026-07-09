import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SyncFlashcardQuizSessionProgressRequest,
} from "./graphql-types"

export class SyncFlashcardQuizSessionProgressCommand {
    constructor(
        readonly params: ExecuteParams<SyncFlashcardQuizSessionProgressRequest>,
    ) { }
}
