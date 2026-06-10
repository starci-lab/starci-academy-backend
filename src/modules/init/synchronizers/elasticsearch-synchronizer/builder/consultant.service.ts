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
    buildCompletionSuggest,
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
                // populate the ES completion field: the consultant's resolved
                // display name as the suggest input, weighted by display order
                // (earlier = more prominent) so the FST-backed autocomplete
                // returns clean, ranked suggestions. the resolver already
                // flattened the localized name onto `fullName`, so no wrapper
                // stripping is needed here.
                const label = (localizedHeadhunter.fullName ?? "").trim()
                const suggest = buildCompletionSuggest({
                    inputs: [label],
                    weight: Math.max(1,
                        100 - (localizedHeadhunter.orderIndex ?? 0)),
                })
                return {
                    locale,
                    // suggest is an index-only field (not on the entity type) — cast so
                    // the generic indexer stores it while keeping the entity contract intact
                    entity: {
                        ...localizedHeadhunter,
                        suggest,
                    } as unknown as ConsultantEntity,
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
