import {
    Locale,
    ModuleEntity,
    ModuleHydrationService,
    ModuleResolverService,
} from "@modules/databases"
import {
    Injectable,
} from "@nestjs/common"
import type {
    LocalizedElasticsearchEntity,
} from "./types"
import {
    ElasticsearchService,
    buildCompletionSuggest,
} from "@modules/elasticsearch"
import _ from "lodash"

@Injectable()
/**
 * Hydrates a module and indexes **per-locale** ES docs with title completion.
 * Split from the course index so module search does not require loading the
 * full course tree.
 */
export class ElasticsearchModuleBuildService {
    constructor(
        private readonly moduleHydration: ModuleHydrationService,
        private readonly moduleResolver: ModuleResolverService,
        private readonly elasticsearchService: ElasticsearchService,
    ) {}

    async buildMultilingualByModuleId(
        moduleId: string,
    ): Promise<Array<LocalizedElasticsearchEntity<ModuleEntity>>> {
        const hydratedModule = await this.moduleHydration.loadById(
            moduleId,
        )
        return Object.values(Locale).map(
            (
                locale,
            ) => {
                const localizedModule = _.cloneDeep(hydratedModule)
                this.moduleResolver.transform(
                    localizedModule,
                    locale,
                )
                // clean label: the localized module title is the autocomplete display
                // string; strip surrounding whitespace (no localized wrapper to remove)
                const label = (localizedModule.title ?? "").trim()
                // populate the ES completion field via the shared builder: the clean
                // title is the suggest input, weighted by display order (earlier =
                // more important) so the FST-backed autocomplete is clean + ranked
                const suggest = buildCompletionSuggest({
                    inputs: [
                        label,
                    ],
                    weight: Math.max(1,
                        100 - (localizedModule.orderIndex ?? 0)),
                })
                return {
                    locale,
                    // suggest is an index-only field (not on the entity type) — cast so the
                    // generic indexer stores it while keeping the entity contract intact
                    entity: {
                        ...localizedModule,
                        suggest,
                    } as unknown as ModuleEntity,
                }
            },
        )
    }

    async buildIndexById(
        id: string,
    ): Promise<void> {
        const multilingualEntities = await this.buildMultilingualByModuleId(id)
        for (const multilingualEntity of multilingualEntities) {
            await this.elasticsearchService.indexEntity(
                {
                    entity: ModuleEntity,
                    data: multilingualEntity.entity,
                    locale: multilingualEntity.locale,
                },
            )
        }
    }
}
