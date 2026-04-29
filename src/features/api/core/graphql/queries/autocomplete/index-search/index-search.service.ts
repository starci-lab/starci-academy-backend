import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import type {
    ExecuteParams,
} from "@features/api/core/types"
import {
    IndexSearchQuery,
} from "./index-search.query"
import type {
    IndexSearchData,
    IndexSearchRequest,
} from "./graphql-types"

@Injectable()
export class IndexSearchService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<IndexSearchRequest>,
    ): Promise<IndexSearchData> {
        return this.queryBus.execute(
            new IndexSearchQuery(params),
        )
    }
}
