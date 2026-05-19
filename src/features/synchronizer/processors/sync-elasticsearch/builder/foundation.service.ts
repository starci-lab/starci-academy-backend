import {
    FoundationEntity,
    FoundationTagEntity,
    FoundationResolverService,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    FoundationNotFoundException,
} from "@modules/exceptions"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import type {
    LocalizedElasticsearchEntity,
} from "./types"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import _ from "lodash"

/**
 * Loads foundations (with tags) from PostgreSQL and materializes per-locale plain objects for Elasticsearch.
 */
@Injectable()
export class ElasticsearchFoundationBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly foundationResolver: FoundationResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * @returns One entry per {@link Locale} with the transformed foundation tree.
     */
    async buildMultilingualByFoundationId(
        foundationId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<FoundationEntity>>> {
        const hydratedFoundation = await this.loadHydratedFoundationPlain(
            foundationId,
        )
        const fallbackLocale = hydratedFoundation.category?.defaultLocale
            ?? hydratedFoundation.defaultLocale
            ?? Locale.En
        return Object.values(Locale).map(
            (locale) => {
                const localizedFoundation = _.cloneDeep(hydratedFoundation)
                this.foundationResolver.transform(
                    localizedFoundation,
                    locale,
                    fallbackLocale,
                )
                return {
                    locale,
                    entity: localizedFoundation,
                }
            },
        )
    }

    private async loadHydratedFoundationPlain(
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
                    orderIndex: "ASC",
                },
            },
        )
        hydratedFoundation.tags = tags.map(
            (tag) => tag.toPlain<FoundationTagEntity>(),
        )
        return hydratedFoundation
    }

    async buildIndexById(
        id: string,
    ): Promise<void> {
        const multilingualEntities = await this.buildMultilingualByFoundationId(id)
        for (const multilingualEntity of multilingualEntities) {
            await this.elasticsearchService.indexEntity(
                {
                    entity: FoundationEntity,
                    data: multilingualEntity.entity,
                    locale: multilingualEntity.locale,
                },
            )
        }
    }
}
