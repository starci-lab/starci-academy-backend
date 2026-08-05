import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    EventEmitterService,
    EventName,
    type ChallengeSubmissionProgressUpdatedEventPayload,
} from "@modules/event"
import {
    ChallengeProgressService,
} from "@modules/bussiness"
import {
    InjectPrimaryPostgreSQLEntityManager,
    EnrollmentEntity,
} from "@modules/databases"
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
