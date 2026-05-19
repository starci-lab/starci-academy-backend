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

    async buildMultilingualByCompanyId(
        companyId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<HeadhuntingCompanyEntity>>> {
        const hydratedCompany = await this.loadHydratedCompanyPlain(companyId)
        return Object.values(Locale).map(
            (locale) => {
                const localizedCompany = _.cloneDeep(hydratedCompany)
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
