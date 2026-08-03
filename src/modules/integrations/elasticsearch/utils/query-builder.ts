import {
    estypes 
} from "@elastic/elasticsearch"

export interface BuildSearchQueryParams {
    filters?: estypes.QueryDslQueryContainer[];
    search?: string;
    searchFields?: string[];
}

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
