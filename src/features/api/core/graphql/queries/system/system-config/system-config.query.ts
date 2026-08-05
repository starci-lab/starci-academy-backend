import {
    ExecuteParams,
} from "../../../../types/execute"

/** CQRS message that loads the public mounted `systemConfig` subset. */
export class SystemConfigQuery {
    constructor(
        readonly params: ExecuteParams<undefined>,
    ) {}
}
