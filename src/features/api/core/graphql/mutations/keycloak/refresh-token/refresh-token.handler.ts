import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    KeycloakJwtPayload,
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
    JwtService,
} from "@nestjs/jwt"
import {
    RefreshTokenCommand,
} from "./refresh-token.command"
import type {
    RefreshTokenCommandResult,
} from "./graphql-types"

@CommandHandler(RefreshTokenCommand)
@Injectable()
export class RefreshTokenHandler
    extends ICQRSHandler<RefreshTokenCommand, RefreshTokenCommandResult>
    implements ICommandHandler<RefreshTokenCommand, RefreshTokenCommandResult>
{
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
        private readonly jwtService: JwtService,
    ) {
        super()
    }

    protected override async process(
        command: RefreshTokenCommand,
    ): Promise<RefreshTokenCommandResult> {
        const {
            refreshToken,
            accessToken,
            request,
        } = command.params

        if (
            request.minValiditySeconds !== undefined &&
            request.minValiditySeconds !== null &&
            typeof accessToken === "string" &&
            accessToken.length > 0
        ) {
            const decoded = this.jwtService.decode<KeycloakJwtPayload>(
                accessToken
            )
            if (
                decoded &&
                typeof decoded === "object" &&
                typeof decoded.exp === "number"
            ) {
                const ttlSeconds =
                    decoded.exp - Math.floor(
                        Date.now() / 1000
                    )
                if (ttlSeconds > request.minValiditySeconds) {
                    return {
                        data: {
                            accessToken,
                        },
                        refreshToken,
                    }
                }
            }
        }
        const token = await this.keycloakTokenService.exchangeRefreshTokenForToken({
            refreshToken,
        })
        return {
            data: {
                accessToken: token.access_token,
            },
            refreshToken: token.refresh_token,
        } 
    }
}

