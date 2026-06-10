import {
    CourseEntity,
} from "@modules/databases"
import {
    AbstractSuggestionsHandler,
} from "@modules/elasticsearch"
import {
    Injectable,
} from "@nestjs/common"
import {
    QueryHandler,
} from "@nestjs/cqrs"
import {
    CourseSuggestionsQuery,
} from "./course-suggestions.query"

/**
 * Course autocomplete (typeahead) handler — ES Completion Suggester.
 *
 * Inherits the entire suggest flow from {@link AbstractSuggestionsHandler}: it
 * reads `{ locale, request: { query, limit } }`, resolves the per-locale `courses`
 * index, runs the FST-backed `suggest` completion field (populated by the ES sync
 * builder with the clean course title + a popularity weight) and maps options to
 * clean `{ id, label }` items. So prefixes like "sys" return "System Design Mastery"
 * instantly, ranked by weight, with built-in fuzzy typo tolerance.
 *
 * The only contribution of this subclass is declaring which entity it serves; the
 * inherited constructor (injecting `ElasticsearchService`) covers all dependencies.
 */
@QueryHandler(CourseSuggestionsQuery)
@Injectable()
export class CourseSuggestionsHandler
    extends AbstractSuggestionsHandler<CourseSuggestionsQuery> {
    /** Entity this handler autocompletes — drives `courses` index resolution. */
    protected readonly entityName = CourseEntity.name
}
