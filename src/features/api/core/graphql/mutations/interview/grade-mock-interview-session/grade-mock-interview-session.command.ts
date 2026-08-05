import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    GradeMockInterviewSessionRequest,
} from "./graphql-types"

/** CQRS envelope so grading runs off the bus, not inside the GraphQL resolver. */
export class GradeMockInterviewSessionCommand {
    constructor(
        readonly params: ExecuteParams<GradeMockInterviewSessionRequest>,
    ) { }
}
