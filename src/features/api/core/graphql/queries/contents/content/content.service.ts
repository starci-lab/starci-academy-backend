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
    ContentQuery,
} from "./content.query"
import {
    ContentRequest,
} from "./graphql-types/request"

@Injectable()
/**
 * Thin QueryBus adapter so ContentResolver never constructs ContentQuery itself.
 */
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
