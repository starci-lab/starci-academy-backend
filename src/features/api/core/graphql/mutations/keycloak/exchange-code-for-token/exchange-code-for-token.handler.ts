import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    KeycloakOidcRedirectService,
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
    ExchangeCodeForTokenCommandResult,
} from "./graphql-types"

@CommandHandler(ExchangeCodeForTokenCommand)
@Injectable()
export class ExchangeCodeForTokenHandler
    extends ICQRSHandler<ExchangeCodeForTokenCommand, ExchangeCodeForTokenCommandResult>
    implements ICommandHandler<ExchangeCodeForTokenCommand, ExchangeCodeForTokenCommandResult>
{
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
        private readonly keycloakOidcRedirectService: KeycloakOidcRedirectService,
    ) {
        super()
    }

    protected override async process(
        command: ExchangeCodeForTokenCommand,
    ): Promise<ExchangeCodeForTokenCommandResult> {
        const {
            code,
            provider,
            state,
        } = command.params.request
        const pkce = await this.keycloakOidcRedirectService.loadPkceBundle(
            provider,
            state,
        )
        const token = await this.keycloakTokenService.exchangeCodeForToken({
            code,
            redirectUri: pkce.redirectUri,
            codeVerifier: pkce.codeVerifier,
        })
        await this.keycloakOidcRedirectService.clearPkceBundle(
            provider,
            state,
        )
        /* Create user if not exists */
        return {
            data: {
                accessToken: token.access_token,
            },
            refreshToken: token.refresh_token,
        }
    }
}

