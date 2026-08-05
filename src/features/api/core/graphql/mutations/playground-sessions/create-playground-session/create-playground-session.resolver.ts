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
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CreatePlaygroundSessionRequest,
} from "./graphql-types/request"
import {
    CreatePlaygroundSessionResponse,
    CreatePlaygroundSessionResponseData,
} from "./graphql-types/response"
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
