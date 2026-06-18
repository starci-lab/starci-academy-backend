import {
    ExecuteParams,
} from "@features/api/core/types"

export class PlatformStatsQuery {
    constructor(
        readonly params: ExecuteParams<undefined>,
    ) {}
}
