import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    HeadhuntingCompanyEntity,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    ExecuteParams,
} from "../../../../types"
import {
    HeadhunterCompaniesQuery,
} from "./headhunting-companies.query"

@Injectable()
/**
 * Service for the headhunting companies list query.
 */
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
        user?: UserEntity,
    ): Promise<Array<HeadhuntingCompanyEntity>> {
        return this.execute({
            request: undefined,
            locale,
            // set by KeycloakOptionalAuthGraphQLGuard only when a valid
            // Bearer token was present; undefined for anonymous viewers
            user,
        })
    }
}
