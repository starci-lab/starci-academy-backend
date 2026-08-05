import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    MyPickableCvAchievementsRequest,
} from "./graphql-types"

/**
 * QueryBus payload for `myPickableCvAchievements`: request + locale + user into
 * {@link MyPickableCvAchievementsHandler}. Constructed by the query service -- not injected.
 */
export class MyPickableCvAchievementsQuery {
    constructor(
        readonly params: ExecuteParams<MyPickableCvAchievementsRequest>,
    ) {}
}
