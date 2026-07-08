import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    StartFlashcardQuizSessionRequest,
} from "./graphql-types"

export class StartFlashcardQuizSessionCommand {
    constructor(
        readonly params: ExecuteParams<StartFlashcardQuizSessionRequest>,
    ) { }
}
