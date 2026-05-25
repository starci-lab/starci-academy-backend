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
} from "@modules/elasticsearch"
import _ from "lodash"

@Injectable()
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
                return {
                    locale,
                    entity: localizedModule,
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
