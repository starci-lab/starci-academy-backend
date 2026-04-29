import {
    Injectable,
    UnauthorizedException,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    KeycloakTokenService,
} from "@modules/keycloak"
import {
    UserService,
} from "@modules/bussiness"
import {
    EncryptionService,
} from "@modules/crypto"
import {
    InjectSuperJson,
} from "@modules/mixin"
import type SuperJson from "superjson"
import {
    GithubOauthRedirectService,
} from "@modules/github"
import {
    MissingRequiredParameterException,
} from "@modules/exceptions"
import {
    GithubOauthRedirectCommand,
    type GithubOauthRedirectCommandResult,
} from "./redirect.command"

@CommandHandler(GithubOauthRedirectCommand)
@Injectable()
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
            throw new UnauthorizedException("Invalid refresh token")
        }

        const user = await this.userService.getUserByKeycloakId(
            introspect.sub,
        )
        if (!user?.id) {
            throw new UnauthorizedException("User not found")
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

