import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    AbstractSuggestionsHandler,
} from "@modules/integrations/elasticsearch/suggestions/abstract-suggestions.handler"
import {
    Injectable,
} from "@nestjs/common"
import {
    QueryHandler,
} from "@nestjs/cqrs"
import {
    CourseSuggestionsQuery,
} from "./course-suggestions.query"

@QueryHandler(CourseSuggestionsQuery)
@Injectable()
/**
 * Course autocomplete (typeahead) handler -- ES Completion Suggester.
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
export class CourseSuggestionsHandler
    extends AbstractSuggestionsHandler<CourseSuggestionsQuery> {
    /** Entity this handler autocompletes -- drives `courses` index resolution. */
    protected readonly entityName = CourseEntity.name
}
