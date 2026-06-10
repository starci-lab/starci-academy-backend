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
    FoundationCategoriesQuery,
} from "./foundation-categories.query"
import {
    FoundationCategoriesPayload,
    FoundationCategoriesRequest,
} from "./graphql-types"

@Injectable()
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
