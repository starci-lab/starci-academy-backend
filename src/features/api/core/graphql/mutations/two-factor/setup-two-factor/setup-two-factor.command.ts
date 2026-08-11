import type {
    ExecuteParams,
} from "../../../../types/execute"

/** CQRS envelope for starting TOTP enrollment for the authenticated user. */
export class SetupTwoFactorCommand {
    constructor(
        readonly params: ExecuteParams<undefined>,
    ) {}
}
