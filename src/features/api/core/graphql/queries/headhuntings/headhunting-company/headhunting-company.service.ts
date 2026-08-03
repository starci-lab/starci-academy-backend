import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    HeadhuntingCompanyEntity,
} from "@modules/databases"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    HeadhunterCompanyQuery,
} from "./headhunting-company.query"
import {
    HeadhuntingCompanyRequest,
} from "./graphql-types"

/**
 * Service for the single headhunting company query.
 */
@Injectable()
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
