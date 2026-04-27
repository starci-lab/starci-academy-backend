import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    KeycloakTokenService,
} from "@modules/keycloak"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    RefreshTokenCommand,
} from "./refresh-token.command"
import type {
    RefreshTokenData,
} from "./graphql-types"

@CommandHandler(RefreshTokenCommand)
@Injectable()
export class RefreshTokenHandler
    extends ICQRSHandler<RefreshTokenCommand, RefreshTokenData>
    implements ICommandHandler<RefreshTokenCommand, RefreshTokenData>
{
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
    ) {
        super()
    }

    protected override async process(
        command: RefreshTokenCommand,
    ): Promise<RefreshTokenData> {
        const {
            refreshToken,
        } = command.params.request

        const token = await this.keycloakTokenService.exchangeRefreshTokenForToken({
            refreshToken,
        })

        return {
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            tokenType: token.token_type,
            expiresIn: token.expires_in,
            idToken: token.id_token,
            scope: token.scope,
            sessionState: token.session_state,
        }
    }
}

