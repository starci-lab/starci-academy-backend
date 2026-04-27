import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    UserEntity,
} from "@modules/databases"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    MeQuery,
} from "./me.query"

/**
 * Thin facade over the `@nestjs/cqrs` {@link QueryBus} that wraps the
 * raw resolver params in a {@link MeQuery} and dispatches it. The
 * actual logic lives in {@link MeHandler}.
 */
@Injectable()
export class MeService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(params: ExecuteParams<undefined>): Promise<UserEntity> {
        return this.queryBus.execute(
            new MeQuery(params),
        )
    }
}
