import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    MilestoneTaskEntity,
} from "../entities"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "../primary.decorators"

@Injectable()
export class MilestoneTaskHydrationService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    async loadById(
        id: string,
    ): Promise<MilestoneTaskEntity> {
        const taskRow = await this.entityManager.findOneOrFail(
            MilestoneTaskEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                    criterias: {
                        translations: true,
                    },
                },
            },
        )
        return taskRow.toPlain<MilestoneTaskEntity>()
    }
}
