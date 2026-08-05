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
    MilestoneTaskProgressUpdatedEventPayload,
} from "@modules/platform/event/types/event-payload/milestone-task-progress-updated"
import {
    PersonalProjectProgressService,
} from "@modules/bussiness/progress/personal-project.service"
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
 * Listens for MilestoneTaskProgressUpdated events (via NATS + local)
 * and recomputes + caches the progress immediately so it's warm for the next query.
 */
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
                // load the course relation -- `courseId` is a virtual @RelationId that
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
