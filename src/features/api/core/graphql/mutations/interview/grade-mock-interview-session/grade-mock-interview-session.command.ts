import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    GradeMockInterviewSessionRequest,
} from "./graphql-types"

export class GradeMockInterviewSessionCommand {
    constructor(
        readonly params: ExecuteParams<GradeMockInterviewSessionRequest>,
    ) { }
}
