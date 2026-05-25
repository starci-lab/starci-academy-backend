import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    HeadhuntingCompanyEntity,
} from "../entities"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "../primary.decorators"
import {
    HeadhuntingCompanyNotFoundException,
} from "@modules/exceptions"

@Injectable()
export class HeadhuntingCompanyHydrationService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    async loadById(
        id: string,
    ): Promise<HeadhuntingCompanyEntity> {
        const company = await this.entityManager.findOne(
            HeadhuntingCompanyEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        if (!company) {
            throw new HeadhuntingCompanyNotFoundException({
                id,
            })
        }
        return company.toPlain<HeadhuntingCompanyEntity>()
    }
}
