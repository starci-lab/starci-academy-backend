import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    KeycloakJwtPayload,
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
import type {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
import {
    JwtService,
} from "@nestjs/jwt"
import {
    InvalidJwtPayloadException 
} from "@modules/exceptions"

@CommandHandler(ExchangeCodeForTokenCommand)
@Injectable()
export class ExchangeCodeForTokenHandler
    extends ICQRSHandler<ExchangeCodeForTokenCommand, ExchangeCodeForTokenCommandResult>
    implements ICommandHandler<ExchangeCodeForTokenCommand, ExchangeCodeForTokenCommandResult>
{
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
        private readonly keycloakOidcRedirectService: KeycloakOidcRedirectService,
        private readonly jwtService: JwtService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
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
        const decoded = this.jwtService.decode<KeycloakJwtPayload>(token.access_token)
        if (!decoded || typeof decoded === "string" || !decoded.sub) {
            throw new InvalidJwtPayloadException(
                {
                    payload: decoded,
                }
            )
        }
        /* Create user if not exists */
        let user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    keycloakId: decoded.sub,
                },
            }
        )
        if (!user) {
            user = this.entityManager.create(
                UserEntity,
                {
                    keycloakId: decoded.sub,
                }
            )
        }
        return {
            data: {
                accessToken: token.access_token,
            },
            refreshToken: token.refresh_token,
        }
    }
}

