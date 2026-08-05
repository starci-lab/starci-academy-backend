import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    MyPickableCvAchievementsRequest,
} from "./graphql-types/request"

/**
 * QueryBus payload for `myPickableCvAchievements`: request + locale + user into
 * {@link MyPickableCvAchievementsHandler}. Constructed by the query service -- not injected.
 */
export class MyPickableCvAchievementsQuery {
    constructor(
        readonly params: ExecuteParams<MyPickableCvAchievementsRequest>,
    ) {}
}
