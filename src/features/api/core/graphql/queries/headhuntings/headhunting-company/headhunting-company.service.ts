import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    HeadhuntingCompanyEntity,
} from "@modules/databases/postgresql/primary/entities/headhunting-company.entity"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    HeadhunterCompanyQuery,
} from "./headhunting-company.query"
import {
    HeadhuntingCompanyRequest,
} from "./graphql-types/request"

@Injectable()
/**
 * Service for the single headhunting company query.
 */
export class HeadhuntingCompanyService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<HeadhuntingCompanyRequest>,
    ): Promise<HeadhuntingCompanyEntity> {
        return this.queryBus.execute(
            new HeadhunterCompanyQuery(params),
        )
    }
}
