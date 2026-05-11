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

/**
 * Listens for ChallengeSubmissionProgressUpdated events (via NATS + local)
 * and recomputes + caches the progress immediately so it's warm for the next query.
 */
@Injectable()
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
                const enrollment = await this.entityManager.findOneOrFail(
                    EnrollmentEntity,
                    {
                        where: { id: payload.enrollmentId },
                        select: { id: true, courseId: true },
                    },
                )
                await this.challengeProgressService.updateProgress({
                    enrollmentId: payload.enrollmentId,
                    courseId: enrollment.courseId,
                })
            },
        })
    }
}
