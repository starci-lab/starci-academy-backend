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
    SyncIdealTextCommand,
} from "./sync-ideal-text.command"

/** Handler for `SyncIdealTextCommand`. */
@CommandHandler(SyncIdealTextCommand)
@Injectable()
export class SyncIdealTextHandler
    extends ICQRSHandler<SyncIdealTextCommand, EnrollmentEntity>
    implements ICommandHandler<SyncIdealTextCommand, EnrollmentEntity> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    /** Process the command. */
    protected override async process(
        command: SyncIdealTextCommand,
    ): Promise<EnrollmentEntity> {
        const { request, user } = command.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }

        const { courseId, ideaText } = request

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

        // Upsert the idea text on the enrollment
        enrollment.ideaText = ideaText

        return this.entityManager.save(
            EnrollmentEntity,
            enrollment,
        )
    }
}
