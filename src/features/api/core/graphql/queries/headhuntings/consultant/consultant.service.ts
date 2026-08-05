import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ConsultantEntity,
} from "@modules/databases/postgresql/primary/entities/consultant.entity"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ConsultantQuery,
} from "./consultant.query"
import {
    ConsultantRequest,
} from "./graphql-types/request"

@Injectable()
/**
 * Service for the single Headhunter query.
 */
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
