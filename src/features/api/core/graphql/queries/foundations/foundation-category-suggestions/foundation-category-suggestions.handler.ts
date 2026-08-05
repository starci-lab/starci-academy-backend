import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    FoundationCategoryEntity,
} from "@modules/databases/postgresql/primary/entities/foundation-category.entity"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    FoundationCategorySuggestionsQuery,
} from "./foundation-category-suggestions.query"
import {
    FoundationCategorySuggestionsPayload,
} from "./graphql-types/response"
import type {
    CategorySuggestionOption,
} from "./types/category-suggestion-option"

/** Default number of suggestions returned. */
const DEFAULT_LIMIT = 8
/** Hard cap so a client cannot pull the whole index via the suggest endpoint. */
const MAX_LIMIT = 20
/** Suggester name used in the ES request + response. */
const SUGGESTER = "categories"

@QueryHandler(FoundationCategorySuggestionsQuery)
@Injectable()
/**
 * Foundation category autocomplete (typeahead) handler -- ES Completion Suggester.
 *
 * Uses the FST-backed `suggest` completion field (populated by the sync builder
 * with the bare tech name + a popularity weight), so prefixes like "do" return
 * "Docker" instantly, ranked by weight, with built-in fuzzy typo tolerance. The
 * suggest `text` is already the clean label and `_id` is the category id, so no
 * post-processing is needed on the client.
 */
export class FoundationCategorySuggestionsHandler
    extends ICQRSHandler<FoundationCategorySuggestionsQuery, FoundationCategorySuggestionsPayload>
    implements IQueryHandler<FoundationCategorySuggestionsQuery, FoundationCategorySuggestionsPayload> {
    constructor(
        private readonly elasticsearch: ElasticsearchService,
    ) {
        super()
    }

    protected override async process(
        query: FoundationCategorySuggestionsQuery,
    ): Promise<FoundationCategorySuggestionsPayload> {
        const {
            locale,
            request,
        } = query.params

        // empty prefix -> no suggestions (the dropdown only shows while typing)
        const prefix = request.query?.trim()
        if (!prefix) {
            return {
                data: [],
            }
        }

        // clamp how many suggestions we ask the FST for
        const limit = Math.min(MAX_LIMIT,
            Math.max(1,
                request.limit ?? DEFAULT_LIMIT))

        // completion suggester over the FST-backed `suggest` field: ranked by weight,
        // de-duplicated, with automatic edit-distance fuzziness for typo tolerance
        const response = await this.elasticsearch.client.search<FoundationCategoryEntity>({
            index: this.elasticsearch.indicateName({
                entity: FoundationCategoryEntity.name,
                locale,
            }),
            suggest: {
                [SUGGESTER]: {
                    prefix,
                    completion: {
                        field: "suggest",
                        size: limit,
                        skip_duplicates: true,
                        fuzzy: {
                            fuzziness: "AUTO",
                        },
                    },
                },
            },
            // we only need the id from the doc; the label comes from the suggest text
            _source: false,
        })

        // suggest[name] is an array (one entry per prefix); take the first entry's options.
        // cast to the completion-option shape we rely on (text = label, _id = category id).
        const entries = response.suggest?.[SUGGESTER] ?? []
        const options = entries[0]?.options ?? []
        const optionList = (Array.isArray(options) ? options : [options]) as Array<CategorySuggestionOption>

        const data = optionList.map((option) => ({
            id: String(option._id ?? ""),
            label: option.text,
        }))

        return {
            data,
        }
    }
}
