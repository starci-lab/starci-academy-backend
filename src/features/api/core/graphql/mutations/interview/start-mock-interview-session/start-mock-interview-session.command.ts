import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    StartMockInterviewSessionRequest,
} from "./graphql-types"

export class StartMockInterviewSessionCommand {
    constructor(
        readonly params: ExecuteParams<StartMockInterviewSessionRequest>,
    ) { }
}
