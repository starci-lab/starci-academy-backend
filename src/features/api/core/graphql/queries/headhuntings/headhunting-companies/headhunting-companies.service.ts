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
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ExecuteParams,
} from "../../../../types/execute"
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
