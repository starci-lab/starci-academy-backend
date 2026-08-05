import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    KeycloakJwtPayload,
} from "@modules/integrations/keycloak/types/jwt-jwks"
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
import {
    RefreshTokenCoalescerService,
} from "./refresh-token-coalescer.service"
import type {
    RefreshTokenCommandResult,
} from "./graphql-types/response"

@CommandHandler(RefreshTokenCommand)
@Injectable()
/**
 * Refreshes tokens, coalescing concurrent calls on the same refresh token so
 * Keycloak rotation cannot invalidate parallel tab refreshes.
 */
export class RefreshTokenHandler
    extends ICQRSHandler<RefreshTokenCommand, RefreshTokenCommandResult>
    implements ICommandHandler<RefreshTokenCommand, RefreshTokenCommandResult>
{
    constructor(
        private readonly refreshTokenCoalescerService: RefreshTokenCoalescerService,
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
        // coalesce concurrent refreshes of the same token into one Keycloak
        // round-trip so refresh-token rotation can't invalidate parallel calls
        const token = await this.refreshTokenCoalescerService.exchange({
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

