import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    InjectPrimaryPostgreSQLEntityManager,
    MilestoneEntity,
    MilestoneTaskEntity,
    MilestoneResolverService,
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
    MilestoneQuery,
} from "./milestone.query"

@QueryHandler(MilestoneQuery)
@Injectable()
export class MilestoneHandler
    extends ICQRSHandler<MilestoneQuery, MilestoneEntity>
    implements IQueryHandler<MilestoneQuery, MilestoneEntity> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly milestoneResolver: MilestoneResolverService,
    ) {
        super()
    }

    protected override async process(
        query: MilestoneQuery,
    ): Promise<MilestoneEntity> {
        const {
            request,
            locale,
        } = query.params

        const milestone = await this.entityManager.findOneOrFail(
            MilestoneEntity,
            {
                where: {
                    id: request.id,
                },
                relations: {
                    translations: true,
                },
            },
        )

        /** Separately load tasks with translations + criteria translations */
        const tasks = await this.entityManager.find(
            MilestoneTaskEntity,
            {
                where: {
                    milestone: {
                        id: milestone.id,
                    },
                },
                relations: {
                    translations: true,
                    criterias: {
                        translations: true,
                    },
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        milestone.tasks = tasks

        return this.milestoneResolver.transform(
            milestone,
            locale || Locale.En, 
        )
    }
}
