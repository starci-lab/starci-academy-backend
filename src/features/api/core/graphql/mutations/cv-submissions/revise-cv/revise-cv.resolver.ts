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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ReviseCvRequest,
} from "./graphql-types/request"
import {
    ReviseCvResponse,
} from "./graphql-types/response"
import {
    ReviseCvService,
} from "./revise-cv.service"

@Resolver()
/** GraphQL entry that authenticates before enqueueing a CV revision. */
export class ReviseCvResolver {
    constructor(
        private readonly reviseCvService: ReviseCvService,
    ) { }

    /**
     * Revise an existing uploaded CV submission using the learner's free-text
     * notes. Validates the source submission exists + belongs to the caller,
     * then creates a `Pending` cv_generations run and enqueues the background
     * revise job (mode = Revise); requires authentication. Poll
     * `cvGeneration(id)` for status + result.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV revision started successfully",
        [Locale.Vi]: "Đã bắt đầu chỉnh sửa CV thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ReviseCvResponse,
        {
            name: "reviseCv",
            description: "Revise an existing CV submission using the learner's free-text prompts.",
        },
    )
    async execute(
        @Args("request")
            request: ReviseCvRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.reviseCvService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
