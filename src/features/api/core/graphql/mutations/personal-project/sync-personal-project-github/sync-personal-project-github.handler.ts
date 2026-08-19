import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    PersonalProjectBranchTooLongException,
} from "@modules/platform/exceptions/errors/personal-project/personal-project-branch-too-long"
import {
    PersonalProjectGithubSyncInputMissingException,
} from "@modules/platform/exceptions/errors/personal-project/personal-project-github-sync-input-missing"
import {
    PersonalProjectGithubUrlMissingException,
} from "@modules/platform/exceptions/errors/personal-project/personal-project-github-url-missing"
import {
    PersonalProjectInvalidBranchNameException,
} from "@modules/platform/exceptions/errors/personal-project/personal-project-invalid-branch-name"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    SyncPersonalProjectGithubCommand,
} from "./sync-personal-project-github.command"
import type {
    GithubSyncIntent,
    UpsertPersonalProjectGithubParams,
} from "./types/sync-personal-project-github"
import type {
    SyncPersonalProjectGithubRequest,
} from "./graphql-types/request"
import {
    UrlValidatorService,
} from "@modules/lib/validators/url.service"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"

const BRANCH_PATTERN = /^[a-zA-Z0-9._/-]+$/
const BRANCH_MAX = 255

@CommandHandler(SyncPersonalProjectGithubCommand)
@Injectable()
/** Handler for `SyncPersonalProjectGithubCommand`. */
export class SyncPersonalProjectGithubHandler
    extends ICQRSHandler<SyncPersonalProjectGithubCommand, void>
    implements ICommandHandler<SyncPersonalProjectGithubCommand, void> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly urlValidatorService: UrlValidatorService,
        private readonly encryptionService: EncryptionService,
    ) {
        super()
    }

    /** Process the command. */
    protected override async process(
        command: SyncPersonalProjectGithubCommand,
    ): Promise<void> {
        const {
            request,
            user,
        } = command.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        const {
            courseId,
        } = request
        await this.entityManager.transaction(async (entityManager) => {
            await this.upsertPersonalProjectGithub({
                entityManager,
                user,
                courseId,
                request,
            })
        })
    }

    /** Upsert GitHub URL and/or branch on the user's enrollment for the course. */
    private async upsertPersonalProjectGithub(
        {
            entityManager,
            user,
            courseId,
            request,
        }: UpsertPersonalProjectGithubParams,
    ): Promise<void> {
        const enrollment = await entityManager.findOneOrFail(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                    course: {
                        id: courseId,
                    },
                },
            },
        )

        const intent = this.resolveGithubSyncIntent(request)

        if (!intent.hasUrl && !intent.branchProvided && !intent.hasToken && !intent.shouldClearToken) {
            throw new PersonalProjectGithubSyncInputMissingException({
            })
        }

        const storedUrlTrimmed = enrollment.personalProjectGithubUrl?.trim() ?? ""
        if (!intent.hasUrl && intent.branchProvided && storedUrlTrimmed.length === 0) {
            throw new PersonalProjectGithubUrlMissingException({
            })
        }

        let didUpdate = false
        if (intent.hasUrl) {
            await this.urlValidatorService.isParsable(intent.urlTrimmed)
            enrollment.personalProjectGithubUrl = intent.urlTrimmed
            didUpdate = true
        }
        if (this.applyBranchUpdate(enrollment,
            intent)) {
            didUpdate = true
        }
        // token: clearing wins over setting. Encrypt at rest (AES-256-GCM); the plaintext is
        // never returned again -- only the masked last4 is exposed (mirrors BYOK key storage).
        if (this.applyTokenUpdate(enrollment,
            intent)) {
            didUpdate = true
        }
        if (!didUpdate) {
            throw new PersonalProjectGithubSyncInputMissingException({
            })
        }
        await entityManager.save(
            EnrollmentEntity,
            enrollment,
        )
    }

    /** Normalize a sync request's raw fields into trimmed, presence-checked intent. */
    private resolveGithubSyncIntent(
        request: SyncPersonalProjectGithubRequest,
    ): GithubSyncIntent {
        const {
            githubUrl,
            branch,
            githubToken,
            clearGithubToken,
        } = request
        const urlTrimmed = typeof githubUrl === "string" ? githubUrl.trim() : ""
        const branchProvided = branch !== undefined && branch !== null
        const tokenTrimmed = typeof githubToken === "string" ? githubToken.trim() : ""
        return {
            urlTrimmed,
            hasUrl: urlTrimmed.length > 0,
            branchProvided,
            branchTrimmed: branchProvided ? String(branch).trim() : "",
            tokenTrimmed,
            hasToken: tokenTrimmed.length > 0,
            shouldClearToken: clearGithubToken === true,
        }
    }

    /**
     * Validate + apply the branch update, when one was provided.
     * @returns Whether the branch field was updated.
     */
    private applyBranchUpdate(
        enrollment: EnrollmentEntity,
        {
            branchProvided,
            branchTrimmed,
        }: GithubSyncIntent,
    ): boolean {
        if (!branchProvided) {
            return false
        }
        if (branchTrimmed.length > BRANCH_MAX) {
            throw new PersonalProjectBranchTooLongException({
                max: BRANCH_MAX,
            })
        }
        if (branchTrimmed.length > 0 && !BRANCH_PATTERN.test(branchTrimmed)) {
            throw new PersonalProjectInvalidBranchNameException({
            })
        }
        enrollment.personalProjectGithubBranch = branchTrimmed.length > 0
            ? branchTrimmed
            : null
        return true
    }

    /**
     * Apply the token update: clearing wins over setting.
     * @returns Whether the token fields were updated.
     */
    private applyTokenUpdate(
        enrollment: EnrollmentEntity,
        {
            shouldClearToken,
            hasToken,
            tokenTrimmed,
        }: GithubSyncIntent,
    ): boolean {
        if (shouldClearToken) {
            enrollment.personalProjectGithubTokenEncrypted = null
            enrollment.personalProjectGithubTokenLast4 = null
            return true
        }
        if (!hasToken) {
            return false
        }
        const payload = this.encryptionService.encrypt({
            plainText: tokenTrimmed,
        })
        enrollment.personalProjectGithubTokenEncrypted = JSON.stringify(payload)
        enrollment.personalProjectGithubTokenLast4 = tokenTrimmed.slice(-4)
        return true
    }
}

