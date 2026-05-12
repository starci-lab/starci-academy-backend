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
} from "@features/api/core/types"
import {
    PublicContentQuery,
} from "./public-content.query"
import {
    PublicContentRequest,
} from "./graphql-types"

@Injectable()
export class PublicContentService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<PublicContentRequest>,
    ): Promise<ContentEntity> {
        return this.queryBus.execute(
            new PublicContentQuery(params),
        )
    }
}
