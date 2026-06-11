import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    MilestoneEntity,
    MilestoneTaskEntity,
} from "../entities"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "../primary.decorators"

@Injectable()
export class MilestoneHydrationService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    async loadById(
        id: string,
    ): Promise<MilestoneEntity> {
        const milestoneRow = await this.entityManager.findOneOrFail(
            MilestoneEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        const hydratedMilestone = milestoneRow.toPlain<MilestoneEntity>()
        const tasks = await this.entityManager.find(
            MilestoneTaskEntity,
            {
                where: {
                    milestone: {
                        id: hydratedMilestone.id,
                    },
                },
                relations: {
                    translations: true,
                    // SCHEMA V2 per-language learner-facing briefs (FE/CDN read path); the internal
                    // outcome/approach grading rubric is deliberately NOT loaded here
                    briefs: {
                        translations: true,
                    },
                    criterias: {
                        translations: true,
                    },
                    codeImplementations: {
                        translations: true,
                    },
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
        hydratedMilestone.tasks = tasks.map(
            (task) => task.toPlain<MilestoneTaskEntity>(),
        )
        return hydratedMilestone
    }
}
