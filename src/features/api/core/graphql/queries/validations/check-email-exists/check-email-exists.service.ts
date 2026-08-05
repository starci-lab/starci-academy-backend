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
    CheckEmailExistsQuery,
} from "./check-email-exists.query"
import type {
    CheckEmailExistsRequest,
} from "./graphql-types/request"
import type {
    CheckEmailExistsData,
} from "./graphql-types/response"

@Injectable()
/** Service responsible for checking email existence via bloom filter. */
export class CheckEmailExistsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<CheckEmailExistsRequest>,
    ): Promise<CheckEmailExistsData> {
        return this.queryBus.execute(
            new CheckEmailExistsQuery(params),
        )
    }
}

