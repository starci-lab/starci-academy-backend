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
/**
 * Loads one milestone task with learner-facing briefs/criteria for FE/CDN.
 * The internal outcome/approach rubric is deliberately omitted here.
 */
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
            },
        )
        return taskRow.toPlain<MilestoneTaskEntity>()
    }
}
