import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ContentEntity,
} from "@modules/databases"
import {
    ExecuteParams,
} from "@features/api/types"
import {
    ContentQuery,
} from "./content.query"
import {
    ContentRequest,
} from "./graphql-types"

@Injectable()
export class ContentQueryService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<ContentRequest>,
    ): Promise<ContentEntity> {
        return this.queryBus.execute(
            new ContentQuery(params),
        )
    }
}
