import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    EventEmitterService,
    EventName,
    type MilestoneTaskProgressUpdatedEventPayload,
} from "@modules/event"
import {
    PersonalProjectProgressService,
} from "@modules/bussiness"
import {
    InjectPrimaryPostgreSQLEntityManager,
    EnrollmentEntity,
} from "@modules/databases"
import type {
    EntityManager,
} from "typeorm"

/**
 * Listens for MilestoneTaskProgressUpdated events (via NATS + local)
 * and recomputes + caches the progress immediately so it's warm for the next query.
 */
@Injectable()
export class MilestoneTaskProgressListener implements OnModuleInit {
    constructor(
        private readonly eventEmitterService: EventEmitterService,
        private readonly personalProjectProgressService: PersonalProjectProgressService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    onModuleInit(): void {
        this.eventEmitterService.on({
            event: EventName.MilestoneTaskProgressUpdated,
            listener: async (payload: MilestoneTaskProgressUpdatedEventPayload) => {
                // load the course relation — `courseId` is a virtual @RelationId that
                // is not populated by a default select
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
                await this.personalProjectProgressService.updateProgress({
                    enrollmentId: payload.enrollmentId,
                    courseId: enrollment.course.id,
                })
            },
        })
    }
}
