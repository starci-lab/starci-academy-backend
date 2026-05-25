import {
    ConsultantEntity,
    ConsultantHydrationService,
    ConsultantResolverService,
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
export class ElasticsearchConsultantBuildService {
    constructor(
        private readonly consultantHydration: ConsultantHydrationService,
        private readonly headhunterResolver: ConsultantResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    async buildMultilingualByHeadhunterId(
        consultantId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<ConsultantEntity>>> {
        const hydratedHeadhunter = await this.consultantHydration.loadById(consultantId)
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
