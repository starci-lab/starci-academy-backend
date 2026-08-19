import {
    Injectable,
} from "@nestjs/common"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import type {
    EntitySearchParams,
} from "../types/entity-search"
import type {
    GlobalSearchItem,
} from "../types/message"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    GlobalSearchEntityUtilsService,
} from "./utils.service"
import {
    searchEntityByFields,
} from "../shared/entity-field-search"

@Injectable()
/**
 * Service for performing global search on modules.
 */
export class ModuleGlobalSearchService {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
        private readonly utilsService: GlobalSearchEntityUtilsService,
    ) {}

    /**
     * Executes the module global search.
     * @param params - The parameters.
     * @returns The global search items.
     */
    async execute(
        params: EntitySearchParams,
    ): Promise<Array<GlobalSearchItem>> {
        return searchEntityByFields(
            this.elasticsearch,
            this.utilsService,
            ModuleEntity.name,
            params,
        )
    }
}
