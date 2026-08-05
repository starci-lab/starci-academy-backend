import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    GradeMockInterviewSessionRequest,
} from "./graphql-types/request"

/** CQRS envelope so grading runs off the bus, not inside the GraphQL resolver. */
export class GradeMockInterviewSessionCommand {
    constructor(
        readonly params: ExecuteParams<GradeMockInterviewSessionRequest>,
    ) { }
}
