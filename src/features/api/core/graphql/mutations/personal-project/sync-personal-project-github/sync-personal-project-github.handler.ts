import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import {
    BadRequestException,
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
    SyncPersonalProjectGithubResult,
    UpsertPersonalProjectGithubParams,
} from "./types"
import {
    UrlValidatorService,
} from "@modules/vaildators"

const BRANCH_PATTERN = /^[a-zA-Z0-9._/-]+$/
const BRANCH_MAX = 255

/** Handler for `SyncPersonalProjectGithubCommand`. */
@CommandHandler(SyncPersonalProjectGithubCommand)
@Injectable()
export class SyncPersonalProjectGithubHandler
    extends ICQRSHandler<SyncPersonalProjectGithubCommand, SyncPersonalProjectGithubResult>
    implements ICommandHandler<SyncPersonalProjectGithubCommand, SyncPersonalProjectGithubResult> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly urlValidatorService: UrlValidatorService,
    ) {
        super()
    }

    /** Process the command. */
    protected override async process(
        command: SyncPersonalProjectGithubCommand,
    ): Promise<SyncPersonalProjectGithubResult> {
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
        const {
            githubUrl,
            branch,
        } = request
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

        const urlTrimmed = typeof githubUrl === "string" ? githubUrl.trim() : ""
        const hasUrl = urlTrimmed.length > 0
        const branchProvided = branch !== undefined && branch !== null
        const branchTrimmed = branchProvided ? String(branch).trim() : ""

        if (!hasUrl && !branchProvided) {
            throw new BadRequestException(
                "Provide githubUrl and/or branch",
            )
        }

        const storedUrlTrimmed = enrollment.personalProjectGithubUrl?.trim() ?? ""
        if (!hasUrl && branchProvided && storedUrlTrimmed.length === 0) {
            throw new BadRequestException(
                "Provide githubUrl or save a personal project GitHub URL on your enrollment first",
            )
        }

        let didUpdate = false
        if (hasUrl) {
            await this.urlValidatorService.isParsable(urlTrimmed)
            enrollment.personalProjectGithubUrl = urlTrimmed
            didUpdate = true
        }
        if (branchProvided) {
            if (branchTrimmed.length > BRANCH_MAX) {
                throw new BadRequestException(
                    `Branch must be at most ${BRANCH_MAX} characters`,
                )
            }
            if (branchTrimmed.length > 0 && !BRANCH_PATTERN.test(branchTrimmed)) {
                throw new BadRequestException(
                    "Invalid branch name",
                )
            }
            enrollment.personalProjectGithubBranch = branchTrimmed.length > 0
                ? branchTrimmed
                : null
            didUpdate = true
        }
        if (!didUpdate) {
            throw new BadRequestException(
                "Provide a non-empty githubUrl and/or branch",
            )
        }
        await entityManager.save(
            EnrollmentEntity,
            enrollment,
        )
    }
}
