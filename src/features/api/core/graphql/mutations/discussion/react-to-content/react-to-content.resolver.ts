import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    ReactionSummaryObject,
} from "../../../shared/discussion"
import {
    ReactToContentRequest,
    ReactToContentResponse,
} from "./graphql-types"
import {
    ReactToContentService,
} from "./react-to-content.service"

@Resolver()
export class ReactToContentResolver {
    constructor(
        private readonly reactToContentService: ReactToContentService,
    ) {}

    /**
     * Sets/changes/removes the current user's reaction on a content.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Reaction updated successfully",
        [Locale.Vi]: "Cập nhật cảm xúc thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ReactToContentResponse,
        {
            name: "reactToContent",
            description: "Sets/changes/removes the current user's reaction on a content.",
        },
    )
    async execute(
        @Args("request")
            request: ReactToContentRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ReactionSummaryObject> {
        return this.reactToContentService.execute({
            request,
            user,
        })
    }
}
