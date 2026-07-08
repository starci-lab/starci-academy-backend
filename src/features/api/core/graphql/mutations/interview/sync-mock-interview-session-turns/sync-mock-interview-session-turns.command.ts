import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SyncMockInterviewSessionTurnsRequest,
} from "./graphql-types"

export class SyncMockInterviewSessionTurnsCommand {
    constructor(
        readonly params: ExecuteParams<SyncMockInterviewSessionTurnsRequest>,
    ) { }
}
