import {
    BadRequestException,
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    EntityManager,
} from "typeorm"
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
    UserNotFoundException,
} from "@modules/exceptions"
import {
    GithubApiAuthService,
} from "@modules/github"
import {
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
} from "@modules/databases"
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
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
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

        // Link the GitHub identity to the user — persist `githubUsername`. This is
        // the ONLY job of the "Link GitHub" callback: `myGithubTeamStatus.linked`
        // is derived from `user.githubUsername`, so persisting it un-blocks the FE.
        // Joining a course's GitHub team is a SEPARATE, per-course step
        // (`requestToTeam(courseId)`), which resolves the correct team slug from
        // the course — the callback must NOT add the user to any hardcoded team.
        const user = await this.entityManager.findOne(
            UserEntity,
            {
                where: {
                    id: userId,
                },
            },
        )
        if (!user) {
            throw new UserNotFoundException({
                id: userId,
            })
        }
        user.githubUsername = githubLogin
        await this.entityManager.save(user)

        // Return redirect URI.
        return {
            redirectUri,
        }
    }
}
