import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    MyPickableCvAchievementsRequest,
} from "./graphql-types"

export class MyPickableCvAchievementsQuery {
    constructor(
        readonly params: ExecuteParams<MyPickableCvAchievementsRequest>,
    ) {}
}
