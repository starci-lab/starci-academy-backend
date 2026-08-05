import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    FoundationCategorySuggestionsQuery,
} from "./foundation-category-suggestions.query"
import {
    FoundationCategorySuggestionsRequest,
} from "./graphql-types/request"
import {
    FoundationCategorySuggestionsPayload,
} from "./graphql-types/response"

@Injectable()
/**
 * Dispatches `FoundationCategorySuggestionsQuery` onto the CQRS bus; `query`
 * wraps the resolver's locale + request into the shared execute params.
 */
export class FoundationCategorySuggestionsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<FoundationCategorySuggestionsRequest>,
    ): Promise<FoundationCategorySuggestionsPayload> {
        return this.queryBus.execute(
            new FoundationCategorySuggestionsQuery(params),
        )
    }

    async query(
        locale: Locale,
        request: FoundationCategorySuggestionsRequest,
    ): Promise<FoundationCategorySuggestionsPayload> {
        return this.execute({
            request,
            locale,
        })
    }
}
