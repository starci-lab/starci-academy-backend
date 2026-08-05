import {
    estypes 
} from "@elastic/elasticsearch"

/**
 * Inputs for a standard bool+optional multi_match query. Empty `search`/`searchFields`
 * must stay filter-only -- adding a match clause with no fields would match nothing.
 */
export interface BuildSearchQueryParams {
    filters?: estypes.QueryDslQueryContainer[];
    search?: string;
    searchFields?: string[];
}

/**
 * Builds the house ES bool query (filters in `must`, optional fuzzy multi_match).
 * Kept as a static helper so every search path shares fuzziness=`AUTO` instead of
 * each handler inventing its own match clause.
 */
export class ElasticsearchQueryBuilder {
    /**
     * Builds a standard Elasticsearch boolean query with optional fuzzy searching.
     * @param params Parameters including base filters and search terms.
     */
    static buildSearchQuery({ filters = [], search, searchFields = [] }: BuildSearchQueryParams): estypes.QueryDslQueryContainer {
        const query: estypes.QueryDslQueryContainer = {
            bool: {
                must: [...filters],
            },
        }

        if (search && searchFields.length > 0) {
            query.bool!.must = Array.isArray(query.bool!.must) ? query.bool!.must : [query.bool!.must as estypes.QueryDslQueryContainer]
            query.bool!.must.push({
                multi_match: {
                    query: search,
                    fields: searchFields,
                    fuzziness: "AUTO",
                },
            })
        }

        return query
    }
}
