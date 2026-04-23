import {
    ExecuteParams,
} from "@features/api/types"

export class SystemConfigQuery {
    constructor(
        readonly params: ExecuteParams<undefined>,
    ) {}
}
