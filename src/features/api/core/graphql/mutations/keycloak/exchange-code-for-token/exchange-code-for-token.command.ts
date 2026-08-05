import type {
    ExchangeCodeForTokenRequest,
} from "./graphql-types/request"

/** Params for the OIDC code exchange -- no authenticated user yet, only the callback payload. */
export interface ExchangeCodeForTokenCommandParams {
    request: ExchangeCodeForTokenRequest
}

/** CQRS envelope for trading the broker callback code + PKCE state for tokens. */
export class ExchangeCodeForTokenCommand {
    constructor(
        readonly params: ExchangeCodeForTokenCommandParams,
    ) {}
}

