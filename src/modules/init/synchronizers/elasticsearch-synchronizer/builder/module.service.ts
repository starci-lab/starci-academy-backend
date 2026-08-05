import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ModuleHydrationService,
} from "@modules/databases/postgresql/primary/hydration/module-hydration.service"
import {
    ModuleResolverService,
} from "@modules/databases/postgresql/primary/resolvers/module-resolver.service"
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
                    entity: Object.assign(
                        localizedModule,
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
