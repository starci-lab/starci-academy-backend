import {
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
} from "@modules/platform/cqrs/icqrs-handler"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"
import type {
    EncryptedPayload,
} from "@modules/crypto/types/encrypted-payload"
import {
    InjectSuperJson,
} from "@modules/lib/mixin/superjson.providers"
import type SuperJson from "superjson"
import {
    InvalidOAuthStatePayloadException,
} from "@modules/platform/exceptions/errors/github/invalid-oauth-state-payload"
import {
    OAuthStateFieldMissingException,
} from "@modules/platform/exceptions/errors/github/oauth-state-field-missing"
import {
    MissingRequiredParameterException,
} from "@modules/platform/exceptions/errors/stdlib/missing-required-parameter"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    GithubApiAuthService,
} from "@modules/integrations/github/auth.service"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    GithubOauthCallbackCommand,
    type GithubOauthCallbackResult,
    type GithubOauthCallbackBoundState,
    type GithubOauthCallbackStatePayload,
} from "./callback.command"
import {
    OAuthStateService,
} from "@modules/platform/oauth-state/oauth-state.service"
import {
    OAuthStatePurpose,
} from "@modules/platform/oauth-state/types"


@CommandHandler(GithubOauthCallbackCommand)
@Injectable()
/**
 * Decrypts the OAuth state, exchanges the code, and writes githubUsername so a forged
 * `state` cannot bind another user's GitHub identity.
 */
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
        private readonly oauthStateService: OAuthStateService,
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
            throw new InvalidOAuthStatePayloadException({
            })
        }

        // Decrypt state payload.
        const decrypted = this.encryptionService.decrypt({
            payload: statePayload,
        })

        // Parse decrypted state payload.
        const { nonce } = this.superJson.parse(decrypted) as GithubOauthCallbackStatePayload

        // Validate decrypted state payload.
        if (!nonce || typeof nonce !== "string") {
            throw new OAuthStateFieldMissingException({
                field: "nonce",
            })
        }

        // Claim the state before any GitHub call. Exactly one concurrent callback
        // can cross this point, so replay cannot relink an account or repeat the
        // external code exchange.
        const boundState = await this.oauthStateService.consume<GithubOauthCallbackBoundState>({
            purpose: OAuthStatePurpose.GithubAccountLink,
            state: nonce,
        })
        if (!boundState) {
            throw new InvalidOAuthStatePayloadException({
            })
        }
        const {
            redirectUri,
            userId,
        } = boundState

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

        // Link the GitHub identity to the user -- persist `githubUsername`. This is
        // the ONLY job of the "Link GitHub" callback: `myGithubTeamStatus.linked`
        // is derived from `user.githubUsername`, so persisting it un-blocks the FE.
        // Joining a course's GitHub team is a SEPARATE, per-course step
        // (`requestToTeam(courseId)`), which resolves the correct team slug from
        // the course -- the callback must NOT add the user to any hardcoded team.
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
