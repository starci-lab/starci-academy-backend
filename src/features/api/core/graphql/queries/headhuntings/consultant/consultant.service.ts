import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ConsultantEntity,
} from "@modules/databases"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ConsultantQuery,
} from "./consultant.query"
import {
    ConsultantRequest,
} from "./graphql-types"

/**
 * Service for the single Headhunter query.
 */
@Injectable()
export class ConsultantService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<ConsultantRequest>,
    ): Promise<ConsultantEntity> {
        return this.queryBus.execute(
            new ConsultantQuery(params),
        )
    }
}
