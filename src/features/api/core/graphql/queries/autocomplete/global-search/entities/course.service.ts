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
    searchByTitleAndDescription,
} from "../shared/simple-title-description-search"

@Injectable()
/**
 * Service for performing global search on courses.
 */
export class CourseGlobalSearchService {
    /**
     * Constructor.
     * @param elasticsearch - The Elasticsearch service.
     */
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {}

    /**
     * Executes the course global search.
     * @param params - The parameters.
     * @returns The global search items.
     */
    async execute(
        params: EntitySearchParams,
    ): Promise<Array<GlobalSearchItem>> {
        return searchByTitleAndDescription(
            this.elasticsearch,
            CourseEntity.name,
            params,
        )
    }
}
