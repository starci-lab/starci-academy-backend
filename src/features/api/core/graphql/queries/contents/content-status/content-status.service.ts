import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ContentStatusQuery,
} from "./content-status.query"
import {
    ContentStatusRequest,
} from "./graphql-types/request"
import type {
    ContentStatusData,
} from "./graphql-types/response"

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
