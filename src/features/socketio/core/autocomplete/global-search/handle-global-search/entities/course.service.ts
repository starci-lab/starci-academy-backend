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
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    GlobalSearchEntityUtilsService,
} from "./utils.service"
import {
    searchEntityByFields,
} from "../shared/entity-field-search"

@Injectable()
/**
 * Service for performing global search on courses.
 */
export class CourseGlobalSearchService {
    /**
     * Constructor.
     * @param elasticsearch - The Elasticsearch service.
     * @param utilsService - The utils service.
     */
    constructor(
        private readonly elasticsearch: ElasticsearchService,
        private readonly utilsService: GlobalSearchEntityUtilsService,
    ) {}

    /**
     * Executes the course global search.
     * @param params - The parameters.
     * @returns The global search items.
     */
    async execute(
        params: EntitySearchParams,
    ): Promise<Array<GlobalSearchItem>> {
        return searchEntityByFields(
            this.elasticsearch,
            this.utilsService,
            CourseEntity.name,
            params,
        )
    }
}
