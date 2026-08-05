import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    KeycloakTokenService,
} from "@modules/integrations/keycloak/token.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
import type SuperJson from "superjson"
import {
    GithubOauthRedirectService,
} from "@modules/integrations/github/oauth-redirect.service"
import {
    InvalidRefreshTokenException,
} from "@modules/platform/exceptions/errors/github/invalid-refresh-token"
import {
    MissingRequiredParameterException,
} from "@modules/platform/exceptions/errors/stdlib/missing-required-parameter"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    GithubOauthRedirectCommand,
    type GithubOauthRedirectCommandResult,
} from "./redirect.command"

@CommandHandler(GithubOauthRedirectCommand)
@Injectable()
/**
 * Verifies the Keycloak refresh token then builds the GitHub authorize URL with encrypted
 * state so the callback can restore user + return URL without trusting query params.
 */
export class GithubOauthRedirectCommandHandler
    extends ICQRSHandler<GithubOauthRedirectCommand, GithubOauthRedirectCommandResult>
    implements ICommandHandler<GithubOauthRedirectCommand, GithubOauthRedirectCommandResult> {
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
        private readonly userService: UserService,
        private readonly githubOauthRedirectService: GithubOauthRedirectService,
        private readonly encryptionService: EncryptionService,
        @InjectSuperJson()
        private readonly superjson: SuperJson,
    ) {
        super()
    }

    /**
     * Process the command.
     * @param command - The command.
     * @returns The result.
     */
    protected override async process(
        command: GithubOauthRedirectCommand,
    ): Promise<GithubOauthRedirectCommandResult> {
        const {
            refreshToken,
            redirectUri,
        } = command.params

        if (!redirectUri || typeof redirectUri !== "string") {
            throw new MissingRequiredParameterException({
                parameter: "redirectUri",
            })
        }

        const introspect = await this.keycloakTokenService.verifyRefreshToken(
            refreshToken,
        )

        if (!introspect.active || !introspect.sub) {
            throw new InvalidRefreshTokenException({
            })
        }

        const user = await this.userService.getUserByKeycloakId(
            introspect.sub,
        )
        if (!user?.id) {
            throw new UserNotFoundException({
                keycloakId: introspect.sub,
            })
        }

        // Encode state for the frontend: { redirectUri, userId } encrypted then wrapped as superjson.
        const encryptedState = this.encryptionService.encrypt(
            {
                plainText: this.superjson.stringify(
                    {
                        redirectUri,
                        userId: user.id,
                    }
                ),
            }
        )
        const state = this.superjson.stringify(
            {
                iv: encryptedState.iv,
                authTag: encryptedState.authTag,
                ciphertext: encryptedState.ciphertext,
            }
        )

        const url = this.githubOauthRedirectService.buildAuthorizeRedirectUrl(
            {
                state,
            }
        )

        return {
            url,
        }
    }
}

