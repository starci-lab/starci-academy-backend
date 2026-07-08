import {
    InputType,
} from "@nestjs/graphql"

/**
 * Request placeholder for `myPickableCvAchievements` (scoped by Keycloak user).
 */
@InputType({
    description: "Request for fetching the current user's pickable StarCi achievements.",
})
export class MyPickableCvAchievementsRequest {}
