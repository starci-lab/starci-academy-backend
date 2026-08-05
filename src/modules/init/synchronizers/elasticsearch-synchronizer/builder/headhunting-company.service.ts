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
    buildCompletionSuggest,
    ElasticsearchService,
} from "@modules/elasticsearch"
import _ from "lodash"

@Injectable()
/**
 * Hydrates a headhunting company and indexes **per-locale** ES docs with title
 * completion. Company search is a standalone index gated by `seed.yaml`
 * headhunting scope.
 */
export class ElasticsearchHeadhunterCompanyBuildService {
    constructor(
        private readonly headhuntingCompanyHydration: HeadhuntingCompanyHydrationService,
        private readonly headhuntingCompanyResolver: HeadhuntingCompanyResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    async buildMultilingualByCompanyId(
        companyId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<HeadhuntingCompanyEntity>>> {
        // load the fully-hydrated company (translations + relations) once
        const hydratedCompany = await this.headhuntingCompanyHydration.loadById(companyId)
        // fan the company out into one localized document per supported locale
        return Object.values(Locale).map(
            (locale) => {
                // clone so each locale gets an isolated, independently-resolved copy
                const localizedCompany = _.cloneDeep(
                    hydratedCompany,
                )
                // collapse the localized translation blob onto the flat searchable fields
                this.headhuntingCompanyResolver.transform(
                    localizedCompany,
                    locale,
                )
                // the resolved `title` is the clean company display name — use it as the
                // single completion input (already free of any localized wrapper)
                const label = (localizedCompany.title ?? "").trim()
                // populate the FST-backed autocomplete field: clean company name weighted
                // by display order (earlier in the list = more popular = surfaced first)
                const suggest = buildCompletionSuggest({
                    inputs: label.length > 0 ? [label] : [],
                    weight: Math.max(1,
                        100 - (localizedCompany.orderIndex ?? 0)),
                })
                return {
                    locale,
                    // `suggest` is an index-only field (not on the entity type) — cast so the
                    // generic indexer stores it while keeping the entity contract intact
                    entity: {
                        ...localizedCompany,
                        suggest,
                    } as unknown as HeadhuntingCompanyEntity,
                }
            },
        )
    }

    async buildIndexById(
        id: string,
    ): Promise<void> {
        // build the per-locale documents, then push each into its locale-specific index
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
