import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    HeadhuntingCompanyEntity,
} from "../entities/headhunting-company.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "../primary.decorators"
import {
    HeadhuntingCompanyNotFoundException,
} from "@modules/platform/exceptions/errors/courses/headhunting-company-not-found"

@Injectable()
/**
 * Loads a headhunting company with translations so locale resolution can run
 * in memory before GraphQL returns the company.
 */
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
