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
    FoundationCategoriesQuery,
} from "./foundation-categories.query"
import {
    FoundationCategoriesRequest,
} from "./graphql-types/request"
import {
    FoundationCategoriesPayload,
} from "./graphql-types/response"

@Injectable()
/**
 * Dispatches `FoundationCategoriesQuery` onto the CQRS bus; `query` wraps the
 * resolver's locale + optional request into the shared execute params.
 */
export class FoundationCategoriesService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<FoundationCategoriesRequest | undefined>,
    ): Promise<FoundationCategoriesPayload> {
        return this.queryBus.execute(
            new FoundationCategoriesQuery(params),
        )
    }

    async query(
        locale: Locale,
        request?: FoundationCategoriesRequest,
    ): Promise<FoundationCategoriesPayload> {
        return this.execute({
            request,
            locale,
        })
    }
}
