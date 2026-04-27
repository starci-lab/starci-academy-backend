import type {
    RefreshTokenRequest,
} from "./graphql-types"

export interface RefreshTokenCommandParams {
    request: RefreshTokenRequest
}

export class RefreshTokenCommand {
    constructor(
        readonly params: RefreshTokenCommandParams,
    ) {}
}

