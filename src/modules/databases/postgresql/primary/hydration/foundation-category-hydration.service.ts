import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    FoundationCategoryEntity,
} from "../entities"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "../primary.decorators"
import {
    FoundationCategoryNotFoundException,
} from "@modules/exceptions"

@Injectable()
export class FoundationCategoryHydrationService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    async loadById(
        id: string,
    ): Promise<FoundationCategoryEntity> {
        const category = await this.entityManager.findOne(
            FoundationCategoryEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                },
            },
        )
        if (!category) {
            throw new FoundationCategoryNotFoundException({
                id,
            })
        }
        return category.toPlain<FoundationCategoryEntity>()
    }
}
