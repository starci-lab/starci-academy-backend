import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    SystemConfigQuery,
} from "./system-config.query"
import {
    SystemConfigData,
} from "./graphql-types"

@Injectable()
/** Dispatches `SystemConfigQuery` onto the CQRS bus. */
export class SystemConfigService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<undefined>,
    ): Promise<SystemConfigData> {
        return this.queryBus.execute(
            new SystemConfigQuery(params),
        )
    }
}
