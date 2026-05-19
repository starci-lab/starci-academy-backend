import {
    ConsultantEntity,
    ConsultantResolverService,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    ConsultantNotFoundException,
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
 * Builds the Elasticsearch index for the headhunter entity.
 */
@Injectable()
export class ElasticsearchConsultantBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly headhunterResolver: ConsultantResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * Build the multilingual entities for the headhunter by its ID.
     * @param consultantId - The ID of the headhunter.
     * @returns The multilingual entities.
     */
    async buildMultilingualByHeadhunterId(
        consultantId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<ConsultantEntity>>> {
        const hydratedHeadhunter = await this.loadHydratedHeadhunterPlain(consultantId)
        const fallbackLocale = hydratedHeadhunter.company?.defaultLocale
            ?? hydratedHeadhunter.defaultLocale
            ?? Locale.En
        return Object.values(Locale).map(
            (locale) => {
                const localizedHeadhunter = _.cloneDeep(hydratedHeadhunter)
                this.headhunterResolver.transform(
                    localizedHeadhunter,
                    locale,
                    fallbackLocale,
                )
                return {
                    locale,
                    entity: localizedHeadhunter,
                }
            },
        )
    }

    /**
     * Load the hydrated headhunter plain.
     * @param id - The ID of the headhunter.
     * @returns The hydrated headhunter plain.
     */
    private async loadHydratedHeadhunterPlain(
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

    /**
     * Build the index for the headhunter by its ID.
     * @param id - The ID of the headhunter.
     */
    async buildIndexById(
        id: string,
    ): Promise<void> {
        const multilingualEntities = await this.buildMultilingualByHeadhunterId(id)
        for (const multilingualEntity of multilingualEntities) {
            await this.elasticsearchService.indexEntity({
                entity: ConsultantEntity,
                data: multilingualEntity.entity,
                locale: multilingualEntity.locale,
            })
        }
    }
}
