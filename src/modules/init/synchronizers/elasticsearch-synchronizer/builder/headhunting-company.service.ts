import {
    HeadhuntingCompanyEntity,
    HeadhuntingCompanyResolverService,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    HeadhuntingCompanyNotFoundException,
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

@Injectable()
export class ElasticsearchHeadhunterCompanyBuildService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly headhuntingCompanyResolver: HeadhuntingCompanyResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    /**
     * Build the multilingual entities for the company by its ID.
     * @param companyId - The ID of the company.
     * @returns The multilingual entities.
     */
    async buildMultilingualByCompanyId(
        companyId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<HeadhuntingCompanyEntity>>> {
        const hydratedCompany = await this.loadHydratedCompanyPlain(companyId)
        return Object.values(Locale).map(
            (locale) => {
                const localizedCompany = _.cloneDeep(
                    hydratedCompany
                )
                this.headhuntingCompanyResolver.transform(
                    localizedCompany,
                    locale,
                )
                return {
                    locale,
                    entity: localizedCompany,
                }
            },
        )
    }

    /**
     * Load the hydrated company plain.
     * @param id - The ID of the company.
     * @returns The hydrated company plain.
     */
    private async loadHydratedCompanyPlain(
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

    /**
     * Build the index for the company by its ID.
     * @param id - The ID of the company.
     */
    async buildIndexById(
        id: string,
    ): Promise<void> {
        const multilingualEntities = await this.buildMultilingualByCompanyId(id)
        for (const multilingualEntity of multilingualEntities) {
            await this.elasticsearchService.indexEntity({
                entity: HeadhuntingCompanyEntity,
                data: multilingualEntity.entity,
                locale: multilingualEntity.locale,
            })
        }
    }
}
