import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    FoundationTagEntity,
} from "../entities/foundation-tag.entity"
import {
    FoundationEntity,
} from "../entities/foundation.entity"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "../primary.decorators"
import {
    FoundationNotFoundException,
} from "@modules/platform/exceptions/errors/courses/foundation-not-found"

@Injectable()
/**
 * Loads a foundation item plus category and tags (with translations) so the
 * catalog page can render without per-tag queries.
 */
export class FoundationHydrationService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    async loadById(
        id: string,
    ): Promise<FoundationEntity> {
        const foundation = await this.entityManager.findOne(
            FoundationEntity,
            {
                where: {
                    id,
                },
                relations: {
                    translations: true,
                    category: true,
                },
            },
        )
        if (!foundation) {
            throw new FoundationNotFoundException({
                id,
            })
        }
        const hydratedFoundation = foundation.toPlain<FoundationEntity>()
        const tags = await this.entityManager.find(
            FoundationTagEntity,
            {
                where: {
                    foundation: {
                        id: hydratedFoundation.id,
                    },
                },
                relations: {
                    translations: true,
                },
                order: {
                    sortIndex: "ASC",
                },
            },
        )
        hydratedFoundation.tags = tags.map(
            (tag) => tag.toPlain<FoundationTagEntity>(),
        )
        return hydratedFoundation
    }
}
