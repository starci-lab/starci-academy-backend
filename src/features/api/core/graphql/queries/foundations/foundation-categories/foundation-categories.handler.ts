import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    FoundationCategoryEntity,
} from "@modules/databases"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    estypes,
} from "@elastic/elasticsearch"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    FoundationCategoriesQuery,
} from "./foundation-categories.query"
import {
    FoundationCategoriesPayload,
} from "./graphql-types"

/** Default page size when the request omits `limit`. */
const DEFAULT_LIMIT = 10
/** Hard cap on page size so a client cannot pull the whole index. */
const MAX_LIMIT = 50

@QueryHandler(FoundationCategoriesQuery)
@Injectable()
/**
 * Lists foundation categories from Elasticsearch (locale index), with optional
 * full-text search and page-based pagination.
 */
export class FoundationCategoriesHandler
    extends ICQRSHandler<FoundationCategoriesQuery, FoundationCategoriesPayload>
    implements IQueryHandler<FoundationCategoriesQuery, FoundationCategoriesPayload> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {
        super()
    }

    protected override async process(
        query: FoundationCategoriesQuery,
    ): Promise<FoundationCategoriesPayload> {
        const {
            locale,
            request,
        } = query.params

        // normalize pagination: 1-based page, clamped page size, derived ES offset
        const pageNumber = Math.max(1,
            request?.pageNumber ?? 1)
        const limit = Math.min(MAX_LIMIT,
            Math.max(1,
                request?.limit ?? DEFAULT_LIMIT))
        const from = (pageNumber - 1) * limit

        // tight name typeahead: prefix-match the TITLE only (e.g. "do" -> Docker).
        // intentionally NOT searching description -- matching descriptions made a
        // single letter return almost every category. Empty search matches all.
        const search = request?.search?.trim()
        const esQuery: estypes.QueryDslQueryContainer = search && search.length > 0
            ? {
                match_phrase_prefix: {
                    title: search,
                },
            }
            : {
                match_all: {
                },
            }

        // page the result with from/size and keep the stable display order
        const response = await this.elasticsearch.client.search<FoundationCategoryEntity>({
            index: this.elasticsearch.indicateName({
                entity: FoundationCategoryEntity.name,
                locale,
            }),
            query: esQuery,
            sort: [
                {
                    sortIndex: {
                        order: "asc",
                    },
                },
            ],
            from,
            size: limit,
            // ask ES for an exact total so pagination can compute the page count
            track_total_hits: true,
        })

        // ES total is either a number or a { value, relation } object -- normalize to a number
        const total = response.hits.total
        const totalCount = typeof total === "number"
            ? total
            : total?.value ?? 0

        const data = response.hits.hits.map(
            (hit) => hit._source as FoundationCategoryEntity,
        )

        return {
            totalCount,
            data,
        }
    }
}
