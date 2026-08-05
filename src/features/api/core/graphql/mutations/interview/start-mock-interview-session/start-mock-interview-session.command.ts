import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    StartMockInterviewSessionRequest,
} from "./graphql-types/request"

/** CQRS envelope so the server-side draw runs off the bus, not in the resolver. */
export class StartMockInterviewSessionCommand {
    constructor(
        readonly params: ExecuteParams<StartMockInterviewSessionRequest>,
    ) { }
}
