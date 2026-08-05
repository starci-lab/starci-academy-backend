import {
    FoundationEntity,
    FoundationHydrationService,
    FoundationResolverService,
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
/**
 * Hydrates a foundation (falls back to category locale) and indexes **per-locale**
 * ES docs. No completion field — foundations are reached via category browse,
 * not typeahead.
 */
export class ElasticsearchFoundationBuildService {
    constructor(
        private readonly foundationHydration: FoundationHydrationService,
        private readonly foundationResolver: FoundationResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    async buildMultilingualByFoundationId(
        foundationId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<FoundationEntity>>> {
        const hydratedFoundation = await this.foundationHydration.loadById(
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
