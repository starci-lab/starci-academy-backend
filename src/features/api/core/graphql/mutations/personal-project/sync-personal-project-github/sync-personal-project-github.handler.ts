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
import {
    UrlValidatorService,
} from "@modules/vaildators"

/** Handler for `SyncPersonalProjectGithubCommand`. */
@CommandHandler(SyncPersonalProjectGithubCommand)
@Injectable()
export class SyncPersonalProjectGithubHandler
    extends ICQRSHandler<SyncPersonalProjectGithubCommand, EnrollmentEntity>
    implements ICommandHandler<SyncPersonalProjectGithubCommand, EnrollmentEntity> {
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
    ): Promise<EnrollmentEntity> {
        const { request, user } = command.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }

        const { courseId, githubUrl } = request

        // Validate the GitHub URL is parseable
        await this.urlValidatorService.isParsable(githubUrl)

        // Find the enrollment for the user + course
        const enrollment = await this.entityManager.findOneOrFail(
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

        // Upsert the GitHub URL on the enrollment
        enrollment.personalProjectGithubUrl = githubUrl

        return this.entityManager.save(
            EnrollmentEntity,
            enrollment,
        )
    }
}
