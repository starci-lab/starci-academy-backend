import {
    ExecuteParams,
} from "@features/api/core/types"

/** CQRS message that triggers the public platform-stats aggregate read. */
export class PlatformStatsQuery {
    constructor(
        readonly params: ExecuteParams<undefined>,
    ) {}
}
