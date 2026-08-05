import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ContentStatusQuery,
} from "./content-status.query"
import {
    ContentStatusRequest,
} from "./graphql-types"
import type {
    ContentStatusData,
} from "./graphql-types"

@Injectable()
/**
 * Thin QueryBus adapter so the resolver never constructs ContentStatusQuery itself.
 */
export class ContentStatusService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<ContentStatusRequest>,
    ): Promise<ContentStatusData> {
        return this.queryBus.execute(
            new ContentStatusQuery(params),
        )
    }
}
