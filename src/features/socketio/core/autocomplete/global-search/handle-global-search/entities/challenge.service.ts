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
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    GlobalSearchEntityUtilsService,
} from "./utils.service"
import {
    searchEntityByFields,
} from "../shared/entity-field-search"

@Injectable()
/**
 * Service for performing global search on challenges.
 */
export class ChallengeGlobalSearchService {
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
     * Executes the challenge global search.
     * @param params - The parameters.
     * @returns The global search items.
     */
    async execute(
        params: EntitySearchParams,
    ): Promise<Array<GlobalSearchItem>> {
        return searchEntityByFields(
            this.elasticsearch,
            this.utilsService,
            ChallengeEntity.name,
            params,
            {
                // prerequisites/hint are searched but description already
                // covers the common case -- requirements is the field most
                // likely to hold a usable fallback snippet when nothing else
                // matched the term.
                extraFields: ["prerequisites",
                    "requirements",
                    "hint"],
                fallbackField: "requirements",
            },
        )
    }
}
