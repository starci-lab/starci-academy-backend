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
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    GlobalSearchEntityUtilsService,
} from "./utils.service"
import {
    searchEntityByFields,
} from "../shared/entity-field-search"

@Injectable()
/**
 * Hits the locale-scoped content ES index (title / description / body) so lesson
 * and article hits appear in autocomplete without dumping them into the
 * course / module / challenge queries.
 */
export class ContentGlobalSearchService {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
        private readonly utilsService: GlobalSearchEntityUtilsService,
    ) {}

    async execute(
        params: EntitySearchParams,
    ): Promise<Array<GlobalSearchItem>> {
        return searchEntityByFields(
            this.elasticsearch,
            this.utilsService,
            ContentEntity.name,
            params,
            {
                extraFields: ["body^1"],
                fallbackField: "body",
            },
        )
    }
}
