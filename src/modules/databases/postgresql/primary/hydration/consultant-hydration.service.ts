import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    ConsultantEntity,
} from "../entities/consultant.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "../primary.decorators"
import {
    ConsultantNotFoundException,
} from "@modules/platform/exceptions/errors/courses/consultant-not-found"

@Injectable()
/**
 * Loads a consultant with translations and company so locale resolution can
 * run in memory -- a bare `findOne` would leave those relations unloaded.
 */
export class ConsultantHydrationService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    async loadById(
        id: string,
    ): Promise<ConsultantEntity> {
        const consultant = await this.entityManager.findOne(
            ConsultantEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                    company: true,
                },
            },
        )
        if (!consultant) {
            throw new ConsultantNotFoundException({
                id,
            })
        }
        return consultant.toPlain<ConsultantEntity>()
    }
}
