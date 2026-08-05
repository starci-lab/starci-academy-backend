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
    MyPickableCvAchievementsQuery,
} from "./my-pickable-cv-achievements.query"
import {
    MyPickableCvAchievementsRequest,
} from "./graphql-types/request"
import {
    MyPickableCvAchievementsViewData,
} from "./graphql-types/response"

@Injectable()
/**
 * Thin CQRS dispatch for `myPickableCvAchievements` -- the CV block editor's
 * "pick from StarCi" data source. Delegates entirely to
 * {@link MyPickableCvAchievementsHandler} via the query bus.
 */
export class MyPickableCvAchievementsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * Dispatch the query and return the caller's pickable capstone achievements.
     *
     * @param params - {@link ExecuteParams} wrapping the request, locale, and user.
     * @returns the current user's pickable milestone task achievements.
     */
    async execute(
        params: ExecuteParams<MyPickableCvAchievementsRequest>,
    ): Promise<MyPickableCvAchievementsViewData> {
        return this.queryBus.execute(
            new MyPickableCvAchievementsQuery(params),
        )
    }
}
