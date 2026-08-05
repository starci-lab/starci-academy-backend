import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    SyncMockInterviewSessionTurnsRequest,
} from "./graphql-types/request"

/** CQRS envelope for a background transcript sync that must not fail loudly. */
export class SyncMockInterviewSessionTurnsCommand {
    constructor(
        readonly params: ExecuteParams<SyncMockInterviewSessionTurnsRequest>,
    ) { }
}
