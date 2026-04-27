import {
    ExecuteParams,
} from "@features/api/core/types"

export class SystemConfigQuery {
    constructor(
        readonly params: ExecuteParams<undefined>,
    ) {}
}
