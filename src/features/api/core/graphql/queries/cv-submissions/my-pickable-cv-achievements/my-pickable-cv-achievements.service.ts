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
    MyPickableCvAchievementsQuery,
} from "./my-pickable-cv-achievements.query"
import {
    MyPickableCvAchievementsRequest,
    MyPickableCvAchievementsViewData,
} from "./graphql-types"

@Injectable()
export class MyPickableCvAchievementsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<MyPickableCvAchievementsRequest>,
    ): Promise<MyPickableCvAchievementsViewData> {
        return this.queryBus.execute(
            new MyPickableCvAchievementsQuery(params),
        )
    }
}
