import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    MilestoneTaskEntity,
    MilestoneTaskResolverService,
    Locale,
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
    TaskQuery,
} from "./task.query"

@QueryHandler(TaskQuery)
@Injectable()
export class TaskHandler
    extends ICQRSHandler<TaskQuery, MilestoneTaskEntity>
    implements IQueryHandler<TaskQuery, MilestoneTaskEntity> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly milestoneTaskResolver: MilestoneTaskResolverService,
    ) {
        super()
    }

    protected override async process(
        query: TaskQuery,
    ): Promise<MilestoneTaskEntity> {
        const {
            request,
            locale,
        } = query.params

        const task = await this.entityManager.findOneOrFail(
            MilestoneTaskEntity,
            {
                where: {
                    id: request.id,
                },
                relations: {
                    translations: true,
                    criterias: {
                        translations: true,
                    },
                    codeImplementations: {
                        translations: true,
                    },
                },
            },
        )

        this.milestoneTaskResolver.transform(
            task,
            locale || Locale.En,
            task.defaultLocale ?? Locale.En,
        )

        return task
    }
}
