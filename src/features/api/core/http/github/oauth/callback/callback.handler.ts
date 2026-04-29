import {
    BadRequestException,
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    EncryptionService,
    type EncryptedPayload,
} from "@modules/crypto"
import {
    InjectSuperJson,
} from "@modules/mixin"
import type SuperJson from "superjson"
import {
    MissingRequiredParameterException,
} from "@modules/exceptions"
import {
    GithubApiAuthService,
} from "@modules/github"
import {
    EnqueueResolveGithubJobService,
} from "@modules/bussiness"
import type {
    EnqueueResolveGithubParams,
} from "@modules/bussiness"
import {
    GithubOauthCallbackCommand,
    type GithubOauthCallbackResult,
    type GithubOauthCallbackStatePayload,
} from "./callback.command"


@CommandHandler(GithubOauthCallbackCommand)
@Injectable()
export class GithubOauthCallbackHandler
    extends ICQRSHandler<GithubOauthCallbackCommand, GithubOauthCallbackResult>
    implements ICommandHandler<GithubOauthCallbackCommand, GithubOauthCallbackResult> {
    constructor(
        private readonly encryptionService: EncryptionService,
        @InjectSuperJson()
        private readonly superJson: SuperJson,
        private readonly githubApiAuthService: GithubApiAuthService,
        private readonly enqueueResolveGithubJobService: EnqueueResolveGithubJobService,
    ) {
        super()
    }

    /**
     * Process the command.
     * @param command - The command.
     * @returns The result.
     */
    protected override async process(
        command: GithubOauthCallbackCommand,
    ): Promise<GithubOauthCallbackResult> {
        const {
            code,
            state,
        } = command.params

        if (!code || typeof code !== "string") {
            throw new MissingRequiredParameterException({
                parameter: "code",
            })
        }
        if (!state || typeof state !== "string") {
            throw new MissingRequiredParameterException({
                parameter: "state",
            })
        }

        // Decrypt state to get { redirectUri, userId }.
        // `redirect.controller.ts` encodes state as `superjson.stringify({ iv, authTag, ciphertext })`.
        const statePayload = this.superJson.parse<EncryptedPayload>(state)

        // Validate state payload.
        const { iv, authTag, ciphertext } = statePayload
        if (!iv || !authTag || !ciphertext) {
            throw new BadRequestException(
                "Invalid OAuth state payload",
            )
        }

        // Decrypt state payload.
        const decrypted = this.encryptionService.decrypt({
            payload: statePayload,
        })

        // Parse decrypted state payload.
        const { redirectUri, userId } = this.superJson.parse(decrypted) as GithubOauthCallbackStatePayload

        // Validate decrypted state payload.
        if (!redirectUri || typeof redirectUri !== "string") {
            throw new BadRequestException(
                "Invalid state: redirectUri missing",
            )
        }
        if (!userId || typeof userId !== "string") {
            throw new BadRequestException(
                "Invalid state: userId missing",
            )
        }

        // Exchange OAuth `code` for access token.
        const {
            accessToken,
        } = await this.githubApiAuthService.exchangeOAuthCodeForAccessToken(
            {
                code,
            },
        )

        // Get GitHub user profile.
        const {
            user: {
                login: githubLogin,
            },
        } = await this.githubApiAuthService.getAuthenticatedUser(
            {
                accessToken,
            },
        )

        // Enqueue resolve GitHub processor.
        const enqueueParams: EnqueueResolveGithubParams = {
            userId,
            githubUsername: githubLogin,
            teamSlug: "starci-academy",
        }
        await this.enqueueResolveGithubJobService.enqueue(
            enqueueParams,
        )

        // Return redirect URI.
        return {
            redirectUri,
        }
    }
}

