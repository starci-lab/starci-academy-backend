import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    KeycloakOidcRedirectService,
} from "@modules/integrations/keycloak/keycloak-oidc-redirect.service"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    KeycloakJwtPayload,
} from "@modules/integrations/keycloak/types/jwt-jwks"
import {
    KeycloakIdentityProvider,
} from "@modules/integrations/keycloak/types/tokens"
import {
    deriveUsername,
} from "@modules/integrations/keycloak/utils/derive-username"
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
} from "./graphql-types/response"
import type {
    EntityManager,
} from "typeorm"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    AuthenticationType,
} from "@modules/databases/postgresql/primary/enums/authentication-type"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    JwtService,
} from "@nestjs/jwt"
import {
    InvalidJwtPayloadException,
} from "@modules/platform/exceptions/errors/keycloak/invalid-jwt-payload"
import {
    EmailBloomFilterService,
} from "@modules/bussiness/bloom-filters/email.service"

@CommandHandler(ExchangeCodeForTokenCommand)
@Injectable()
/**
 * Completes social login: consumes the one-time PKCE bundle, upserts the local
 * user from the Keycloak JWT, and returns tokens. The refresh token stays off
 * the GraphQL payload so the resolver can lock it in an httpOnly cookie.
 */
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
                    username: deriveUsername({
                        email: decoded.email,
                        fallback: decoded.preferred_username,
                    }),
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

