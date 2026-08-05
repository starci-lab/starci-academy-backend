import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    PublicContentQuery,
} from "./public-content.query"
import {
    PublicContentRequest,
} from "./graphql-types/request"

@Injectable()
/**
 * Thin QueryBus adapter so PublicContentResolver never constructs PublicContentQuery itself.
 */
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
