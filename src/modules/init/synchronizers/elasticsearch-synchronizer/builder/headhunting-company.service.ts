import {
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    HeadhuntingCompanyHydrationService,
} from "@modules/databases/postgresql/primary/hydration/headhunting-company-hydration.service"
import {
    HeadhuntingCompanyResolverService,
} from "@modules/databases/postgresql/primary/resolvers/headhunting-company-resolver.service"
import {
    Injectable,
} from "@nestjs/common"
import type {
    LocalizedElasticsearchEntity,
} from "./types"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    buildCompletionSuggest,
} from "@modules/integrations/elasticsearch/utils/completion"

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
                const localizedCompany = structuredClone(
                    hydratedCompany,
                )
                // collapse the localized translation blob onto the flat searchable fields
                this.headhuntingCompanyResolver.transform(
                    localizedCompany,
                    locale,
                )
                // the resolved `title` is the clean company display name -- use it as the
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
                    entity: Object.assign(
                        localizedCompany,
                        {
                            suggest,
                        },
                    ),
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
