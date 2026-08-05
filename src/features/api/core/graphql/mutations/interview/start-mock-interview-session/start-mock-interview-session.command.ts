import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    StartMockInterviewSessionRequest,
} from "./graphql-types"

/** CQRS envelope so the server-side draw runs off the bus, not in the resolver. */
export class StartMockInterviewSessionCommand {
    constructor(
        readonly params: ExecuteParams<StartMockInterviewSessionRequest>,
    ) { }
}
