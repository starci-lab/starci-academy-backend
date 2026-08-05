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
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    RequestToTeamRequest,
    RequestToTeamResponse,
    RequestToTeamData,
} from "./graphql-types"
import {
    RequestToTeamService,
} from "./request-to-team.service"

@Resolver()
/**
 * Mutation: request to join the GitHub team of an enrolled course (enqueues the
 * resolve-github invite). Separate from linking the GitHub identity. Auth-only;
 * the handler rejects when the viewer has not linked GitHub yet.
 */
export class RequestToTeamResolver {
    constructor(
        private readonly service: RequestToTeamService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Team join request sent successfully",
        [Locale.Vi]: "Đã gửi yêu cầu vào team thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => RequestToTeamResponse,
        {
            name: "requestToTeam",
            description: "Request to join the GitHub team mapped to an enrolled course.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("request",
            {
                description: "The enrolled course whose GitHub team to join.",
            })
            request: RequestToTeamRequest,
    ): Promise<RequestToTeamData> {
        return this.service.execute(user,
            request)
    }
}
