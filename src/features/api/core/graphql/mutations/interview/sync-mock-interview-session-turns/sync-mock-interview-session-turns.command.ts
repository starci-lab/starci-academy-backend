import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SyncMockInterviewSessionTurnsRequest,
} from "./graphql-types"

/** CQRS envelope for a background transcript sync that must not fail loudly. */
export class SyncMockInterviewSessionTurnsCommand {
    constructor(
        readonly params: ExecuteParams<SyncMockInterviewSessionTurnsRequest>,
    ) { }
}
