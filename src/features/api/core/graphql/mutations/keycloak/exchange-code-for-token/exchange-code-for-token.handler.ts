import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    KeycloakJwtPayload,
    KeycloakOidcRedirectService,
    KeycloakTokenService,
    KeycloakIdentityProvider,
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
    AuthenticationType,
} from "@modules/databases"
import {
    JwtService,
} from "@nestjs/jwt"
import {
    InvalidJwtPayloadException 
} from "@modules/exceptions"
import { 
    EmailBloomFilterService 
} from "@modules/bussiness"

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
        private readonly emailBloomFilterService: EmailBloomFilterService,
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
        /* Map Keycloak identity provider to authentication type */
        const typeToProvider: Record<
            KeycloakIdentityProvider, 
            AuthenticationType
        > = {
            [KeycloakIdentityProvider.Google]: AuthenticationType.Google,
            [KeycloakIdentityProvider.Github]: AuthenticationType.Github,
        }
        /* Create user if not exists */
        if (!user) {
            user = this.entityManager.create(
                UserEntity,
                {
                    email: decoded.email,
                    username: decoded.preferred_username,
                    avatarUrl: decoded.picture,
                    keycloakId: decoded.sub,
                    authenticationType: typeToProvider[provider],
                }
            )
            await this.entityManager.save(user)
            await this.emailBloomFilterService.add(user.email ?? "")
        }
        return {
            data: {
                accessToken: token.access_token,
            },
            refreshToken: token.refresh_token,
        }
    }
}

