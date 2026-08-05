import {
    InputType,
} from "@nestjs/graphql"

@InputType({
    description: "Request for fetching the current user's pickable StarCi achievements.",
})
/**
 * Request placeholder for `myPickableCvAchievements` (scoped by Keycloak user).
 */
export class MyPickableCvAchievementsRequest {}
