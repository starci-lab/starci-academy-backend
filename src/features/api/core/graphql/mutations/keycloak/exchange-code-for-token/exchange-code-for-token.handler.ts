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
    ExchangeCodeForTokenCommand,
} from "./exchange-code-for-token.command"
import type {
    ExchangeCodeForTokenData,
} from "./graphql-types"

@CommandHandler(ExchangeCodeForTokenCommand)
@Injectable()
export class ExchangeCodeForTokenHandler
    extends ICQRSHandler<ExchangeCodeForTokenCommand, ExchangeCodeForTokenData>
    implements ICommandHandler<ExchangeCodeForTokenCommand, ExchangeCodeForTokenData>
{
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
    ) {
        super()
    }

    protected override async process(
        command: ExchangeCodeForTokenCommand,
    ): Promise<ExchangeCodeForTokenData> {
        try {
            const {
                code,
                provider,
                redirectUri,
                codeVerifier,
            } = command.params.request
            const token = await this.keycloakTokenService.exchangeCodeForToken({
                code,
                provider,
                redirectUri,
                codeVerifier,
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
        } catch (error) {
            console.log(error)
            throw error
        }
    }
}

