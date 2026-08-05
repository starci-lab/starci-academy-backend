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
    GraphQLLocale,
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
    CreatePlaygroundSessionRequest,
    CreatePlaygroundSessionResponse,
    CreatePlaygroundSessionResponseData,
} from "./graphql-types"
import {
    CreatePlaygroundSessionService,
} from "./create-playground-session.service"

@Resolver()
/**
 * GraphQL entry: creates a playground session (pairing code) for the
 * authenticated, entitled (actively enrolled) learner.
 */
export class CreatePlaygroundSessionResolver {
    constructor(
        private readonly createPlaygroundSessionService: CreatePlaygroundSessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Medium)
    @GraphQLSuccessMessage({
        [Locale.En]: "Playground session created successfully",
        [Locale.Vi]: "Tạo phiên playground thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => CreatePlaygroundSessionResponse,
        {
            name: "createPlaygroundSession",
            description: "Creates a playground session (pairing code) for the current learner. Requires an active enrollment.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Playground to create a session for.",
            },
        )
            request: CreatePlaygroundSessionRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<CreatePlaygroundSessionResponseData> {
        return this.createPlaygroundSessionService.execute(
            {
                request,
                user,
                locale,
            },
        )
    }
}
