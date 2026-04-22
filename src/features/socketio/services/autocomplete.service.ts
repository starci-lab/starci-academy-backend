import {
    Injectable,
} from "@nestjs/common"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    ChallengeEntity,
    ContentEntity,
    CourseEntity,
    LessonVideoEntity,
} from "@modules/databases"
import {
    estypes,
} from "@elastic/elasticsearch"
import {
    AutocompleteEntity,
    AutocompleteRequest,
    AutocompleteResponse,
    AutocompleteSuggestion,
} from "../dtos"

/**
 * Field that is indexed as `search_as_you_type` in ES.
 * Synchronizers should index each document's `title` with this field type
 * so that ES creates the sub-fields ._2gram, ._3gram, ._index_prefix.
 */
const TITLE_FIELD = "title"

/**
 * Map between entity kind and the entity class used to resolve the
 * ES index name (ElasticsearchService.indicateName uses entity.name).
 */
const entityMap: Record<AutocompleteEntity, { name: string }> = {
    [AutocompleteEntity.Course]: CourseEntity,
    [AutocompleteEntity.LessonVideo]: LessonVideoEntity,
    [AutocompleteEntity.Challenge]: ChallengeEntity,
    [AutocompleteEntity.Content]: ContentEntity,
}

const DEFAULT_SIZE = 5

@Injectable()
export class AutocompleteService {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {}

    /**
     * Build a bool-query that leverages `search_as_you_type` for
     * instant suggestions while still allowing fuzzy fallback.
     */
    private buildQuery(term: string): estypes.QueryDslQueryContainer {
        return {
            bool: {
                should: [
                    // Primary: search_as_you_type on title and its shingle sub-fields.
                    {
                        multi_match: {
                            query: term,
                            type: "bool_prefix",
                            fields: [
                                `${TITLE_FIELD}^4`,
                                `${TITLE_FIELD}._2gram^3`,
                                `${TITLE_FIELD}._3gram^2`,
                            ],
                        },
                    },
                    // Fallback: fuzzy match to tolerate typos.
                    {
                        match: {
                            [TITLE_FIELD]: {
                                query: term,
                                fuzziness: "AUTO",
                                prefix_length: 1,
                            },
                        },
                    },
                ],
                minimum_should_match: 1,
            },
        }
    }

    /**
     * Run autocomplete against one ES index.
     */
    private async searchOne(
        entity: AutocompleteEntity,
        term: string,
        size: number,
    ): Promise<Array<AutocompleteSuggestion>> {
        const entityClass = entityMap[entity]
        const response = await this.elasticsearch.client.search({
            index: this.indexName(entityClass.name),
            size,
            query: this.buildQuery(term),
            highlight: {
                fields: {
                    [TITLE_FIELD]: {
                    },
                },
                pre_tags: ["<em>"],
                post_tags: ["</em>"],
            },
            _source: ["id", TITLE_FIELD],
        })

        return response.hits.hits.map((hit) => {
            const source = hit._source as { id?: string; title?: string }
            return {
                id: source?.id ?? hit._id,
                entity,
                title: source?.title ?? "",
                highlight: hit.highlight?.[TITLE_FIELD]?.[0],
                score: hit._score ?? 0,
            }
        })
    }

    /**
     * The ElasticsearchService exposes `indicateName` only via the
     * internal configMap; we mirror the lookup here by calling the
     * public `search` API with a precomputed entity name. However
     * for direct client.search calls we need the index string itself,
     * so we re-use ElasticsearchService via a small helper.
     */
    private indexName(entityName: string): string {
        // Keep in sync with modules/elasticsearch/config.ts.
        // Using a lookup here avoids touching private members of the service.
        const map: Record<string, string> = {
            [CourseEntity.name]: "courses",
            [LessonVideoEntity.name]: "lesson-videos",
            [ChallengeEntity.name]: "challenges",
            [ContentEntity.name]: "contents",
        }
        return map[entityName]
    }

    /**
     * Fan-out query across the requested entities, then merge & sort by score.
     */
    async autocomplete(
        request: AutocompleteRequest,
    ): Promise<AutocompleteResponse> {
        const term = request.query?.trim() ?? ""
        if (term.length === 0) {
            return {
                query: term,
                suggestions: [],
            }
        }

        const entities = request.entities?.length
            ? request.entities
            : Object.values(AutocompleteEntity)
        const size = request.size ?? DEFAULT_SIZE

        const results = await Promise.all(
            entities.map((entity) =>
                this.searchOne(entity, term, size).catch(() => [] as Array<AutocompleteSuggestion>),
            ),
        )

        const suggestions = results
            .flat()
            .sort((a, b) => b.score - a.score)

        return {
            query: term,
            suggestions,
        }
    }
}
