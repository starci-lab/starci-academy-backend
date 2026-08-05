import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    AbstractGraphQLResponse,
    IAbstractGraphQLResponse,
} from "@modules/api"
import {
    MyAchievementItemData,
} from "../../../achievements/my-achievements/graphql-types"

@ObjectType({
    description: "Response wrapper for the userAchievements query.",
})
/**
 * Response wrapper for the userAchievements query.
 *
 * Reuses {@link MyAchievementItemData} (same shape): each item carries the
 * profile owner's earned status + live progress toward the achievement. The
 * difference from `myAchievements` is only the subject — here it is the user
 * named in the route, not the authenticated viewer.
 */
export class UserAchievementsResponse
    extends AbstractGraphQLResponse
    implements IAbstractGraphQLResponse<Array<MyAchievementItemData>> {
    @Field(
        () => [MyAchievementItemData],
        {
            nullable: true,
            description: "Every achievement with the profile owner's earned status + progress.",
        },
    )
        data: Array<MyAchievementItemData>
}
