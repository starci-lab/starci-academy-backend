import {
    Args, Query, Resolver
} from "@nestjs/graphql"
import {
    UseGuards, UseInterceptors
} from "@nestjs/common"
import {
    GraphQLTransformInterceptor
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakAuthGraphQLGuard
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    UserEntity
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    GraphQLEnrollmentGuard
} from "@modules/bussiness/guards/graphql-enrollment.guard"
import {
    FlashcardQuizEligibilityService
} from "./flashcard-quiz-eligibility.service"
import {
    FlashcardQuizEligibilityArgs, FlashcardQuizEligibilityResponse
} from "./graphql-types/response"

@Resolver()
/** Authenticated GraphQL entrypoint for the read-only eligibility inventory. */
export class FlashcardQuizEligibilityResolver {
    constructor(private readonly service: FlashcardQuizEligibilityService) {}

    @UseGuards(KeycloakAuthGraphQLGuard,
        GraphQLEnrollmentGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(() => FlashcardQuizEligibilityResponse,
        {
            name: "flashcardQuizEligibility"
        })
    execute(
        @Args() args: FlashcardQuizEligibilityArgs,
        @KeycloakGraphQLUser() user: UserEntity,
    ) {
        return this.service.find(user.id,
            args.courseId,
            args.deckIds ?? [],
            args.requestedItemCount)
    }
}
