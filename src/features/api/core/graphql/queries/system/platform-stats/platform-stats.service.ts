import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    PlatformStatsQuery,
} from "./platform-stats.query"
import {
    PlatformStatsData,
} from "./graphql-types/response"

@Injectable()
/** Dispatches `PlatformStatsQuery` onto the CQRS bus. */
export class PlatformStatsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<undefined>,
    ): Promise<PlatformStatsData> {
        return this.queryBus.execute(
            new PlatformStatsQuery(params),
        )
    }
}
