import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ModulesQuery,
} from "./modules.query"
import {
    ModulesRequest,
    ModulesResponseData,
} from "./graphql-types"
import {
    ExecuteParams,
} from "../../../../types"
/**
 * Service for performing modules queries.
 */
@Injectable()
export class ModulesService {
    /**
     * Constructor.
     * @param queryBus - The query bus.
     */
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * Executes the modules query.
     * @param params - The parameters.
     * @returns The modules response data.
     */
    async execute(
        params: ExecuteParams<ModulesRequest>,
    ): Promise<ModulesResponseData> {
        return this.queryBus.execute(
            new ModulesQuery(params),
        )
    }
}
