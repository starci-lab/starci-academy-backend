import {
    HeadhuntingCompanyEntity,
    HeadhuntingCompanyHydrationService,
    HeadhuntingCompanyResolverService,
    Locale,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
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
        private readonly headhuntingCompanyHydration: HeadhuntingCompanyHydrationService,
        private readonly headhuntingCompanyResolver: HeadhuntingCompanyResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    async buildMultilingualByCompanyId(
        companyId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<HeadhuntingCompanyEntity>>> {
        const hydratedCompany = await this.headhuntingCompanyHydration.loadById(companyId)
        return Object.values(Locale).map(
            (locale) => {
                const localizedCompany = _.cloneDeep(
                    hydratedCompany,
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
