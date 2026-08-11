import type {
    ExecuteParams,
} from "../../../../types/execute"
import type {
    DisableTwoFactorRequest,
} from "./graphql-types/request"

/** CQRS envelope for disabling the authenticated user's second factor. */
export class DisableTwoFactorCommand {
    constructor(
        readonly params: ExecuteParams<DisableTwoFactorRequest>,
    ) {}
}
