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
    searchByTitleAndDescription,
} from "../shared/simple-title-description-search"

@Injectable()
/**
 * Service for performing global search on modules.
 */
export class ModuleGlobalSearchService {
    /**
     * Constructor.
     * @param elasticsearch - The Elasticsearch service.
     */
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {}

    /**
     * Executes the module global search.
     * @param params - The parameters.
     * @returns The global search items.
     */
    async execute(
        params: EntitySearchParams,
    ): Promise<Array<GlobalSearchItem>> {
        return searchByTitleAndDescription(
            this.elasticsearch,
            ModuleEntity.name,
            params,
        )
    }
}
