import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    Locale,
} from "@modules/databases"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    FoundationCategorySuggestionsQuery,
} from "./foundation-category-suggestions.query"
import {
    FoundationCategorySuggestionsPayload,
    FoundationCategorySuggestionsRequest,
} from "./graphql-types"

@Injectable()
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
