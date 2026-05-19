import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    HeadhuntingCompanyEntity,
    Locale,
} from "@modules/databases"
import {
    ExecuteParams,
} from "../../../../types"
import {
    HeadhunterCompaniesQuery,
} from "./headhunting-companies.query"

@Injectable()
export class HeadhuntingCompaniesService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<void>,
    ): Promise<Array<HeadhuntingCompanyEntity>> {
        return this.queryBus.execute(
            new HeadhunterCompaniesQuery(params),
        )
    }

    async query(
        locale: Locale,
    ): Promise<Array<HeadhuntingCompanyEntity>> {
        return this.execute({
            request: undefined,
            locale,
        })
    }
}
