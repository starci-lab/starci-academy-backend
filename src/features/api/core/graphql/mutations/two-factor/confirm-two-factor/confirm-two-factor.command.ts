import type {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    ConfirmTwoFactorRequest,
} from "./graphql-types/request"

/** CQRS envelope for proving the pending TOTP secret. */
export class ConfirmTwoFactorCommand {
    constructor(
        readonly params: ExecuteParams<ConfirmTwoFactorRequest>,
    ) {}
}
