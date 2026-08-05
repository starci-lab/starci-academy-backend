import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    EventName,
} from "@modules/platform/event/enums/event-name"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import type {
    ChallengeSubmissionProgressUpdatedEventPayload,
} from "@modules/platform/event/types/event-payload/challenge-submission-progress-updated"
import {
    ChallengeProgressService,
} from "@modules/bussiness/progress/challenge.service"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import type {
    EntityManager,
} from "typeorm"

@Injectable()
/**
 * Listens for ChallengeSubmissionProgressUpdated events (via NATS + local)
 * and recomputes + caches the progress immediately so it's warm for the next query.
 */
export class ChallengeSubmissionProgressListener implements OnModuleInit {
    constructor(
        private readonly eventEmitterService: EventEmitterService,
        private readonly challengeProgressService: ChallengeProgressService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    onModuleInit(): void {
        this.eventEmitterService.on({
            event: EventName.ChallengeSubmissionProgressUpdated,
            listener: async (payload: ChallengeSubmissionProgressUpdatedEventPayload) => {
                // load the course relation explicitly -- `courseId` is a virtual
                // @RelationId that TypeORM cannot resolve via the default select
                const enrollment = await this.entityManager.findOneOrFail(
                    EnrollmentEntity,
                    {
                        where: {
                            id: payload.enrollmentId,
                        },
                        relations: {
                            course: true,
                        },
                        select: {
                            id: true,
                            course: {
                                id: true,
                            },
                        },
                    },
                )
                await this.challengeProgressService.recompute(
                    {
                        enrollmentId: payload.enrollmentId,
                        courseId: enrollment.course.id,
                    }
                )
            },
        })
    }
}
