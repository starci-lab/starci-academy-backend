import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    MilestoneEntity,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import type {
    EntityManager,
} from "typeorm"
import {
    MilestonesSingleQuery,
} from "./milestones.query"

@QueryHandler(MilestonesSingleQuery)
@Injectable()
export class MilestonesHandler
    extends ICQRSHandler<MilestonesSingleQuery, Array<MilestoneEntity>>
    implements IQueryHandler<MilestonesSingleQuery, Array<MilestoneEntity>> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(query: MilestonesSingleQuery): Promise<Array<MilestoneEntity>> {
        const {
            request,
            user,
        } = query.params

        const { courseId } = request
        if (!courseId || !user?.id) {
            return []
        }

        /** Find the user's enrollment for this course. */
        const enrollment = await this.entityManager.findOne(
            EnrollmentEntity,
            {
                where: {
                    course: {
                        id: courseId,
                    },
                    user: {
                        id: user.id,
                    },
                },
            },
        )

        if (!enrollment) {
            return []
        }

        /** Load milestones with nested tasks and pass criteria. */
        return this.entityManager.find(
            MilestoneEntity,
            {
                where: {
                    enrollment: {
                        id: enrollment.id,
                    },
                },
                relations: {
                    tasks: {
                        passCriteria: true,
                    },
                },
                order: {
                    orderIndex: "ASC",
                    tasks: {
                        orderIndex: "ASC",
                        passCriteria: {
                            orderIndex: "ASC",
                        },
                    },
                },
            },
        )
    }
}
