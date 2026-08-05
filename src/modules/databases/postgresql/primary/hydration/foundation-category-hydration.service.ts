import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    FoundationCategoryEntity,
} from "../entities/foundation-category.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "../primary.decorators"
import {
    FoundationCategoryNotFoundException,
} from "@modules/platform/exceptions/errors/courses/foundation-category-not-found"

@Injectable()
/**
 * Loads a foundation category with translations so the public catalog can
 * resolve locale without a second round-trip.
 */
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
