import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    FoundationCategoryEntity,
    Locale,
} from "@modules/databases"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    FoundationCategoriesQuery,
} from "./foundation-categories.query"

@Injectable()
export class FoundationCategoriesService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<void>,
    ): Promise<Array<FoundationCategoryEntity>> {
        return this.queryBus.execute(
            new FoundationCategoriesQuery(params),
        )
    }

    async query(
        locale: Locale,
    ): Promise<Array<FoundationCategoryEntity>> {
        return this.execute({
            request: undefined,
            locale,
        })
    }
}
