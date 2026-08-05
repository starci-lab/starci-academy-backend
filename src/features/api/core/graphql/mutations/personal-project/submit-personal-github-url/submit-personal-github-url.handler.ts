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
    SubmitPersonalGithubUrlCommand,
} from "./submit-personal-github-url.command"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"

@CommandHandler(SubmitPersonalGithubUrlCommand)
@Injectable()
/**
 * Persists `personalProjectGithubUrl` on the caller's enrollment. Does not
 * invite to the org team -- that is requestToTeam, so a URL save never
 * accidentally triggers a GitHub invite.
 */
export class SubmitPersonalGithubUrlHandler
    extends ICQRSHandler<SubmitPersonalGithubUrlCommand, EnrollmentEntity>
    implements ICommandHandler<SubmitPersonalGithubUrlCommand, EnrollmentEntity> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        command: SubmitPersonalGithubUrlCommand,
    ): Promise<EnrollmentEntity> {
        const { request, user } = command.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }

        const enrollment = await this.entityManager.findOneOrFail(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                    course: {
                        id: request.courseId,
                    }
                },
            },
        )

        enrollment.personalProjectGithubUrl = request.githubUrl

        return this.entityManager.save(
            EnrollmentEntity,
            enrollment,
        )
    }
}
