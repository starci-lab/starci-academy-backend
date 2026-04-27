import type {
    ExchangeCodeForTokenRequest,
} from "./graphql-types"

export interface ExchangeCodeForTokenCommandParams {
    request: ExchangeCodeForTokenRequest
}

export class ExchangeCodeForTokenCommand {
    constructor(
        readonly params: ExchangeCodeForTokenCommandParams,
    ) {}
}

