import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import {
    IndexSearchQuery,
} from "./index-search.query"
import type {
    IndexSearchRequest,
} from "./graphql-types/request"
import type {
    IndexSearchData,
} from "./graphql-types/response"

@Injectable()
/**
 * Thin QueryBus adapter for `indexSearch` -- keeps the resolver free of CQRS types.
 */
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
