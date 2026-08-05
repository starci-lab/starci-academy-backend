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
    GenerateCvRequest,
} from "./graphql-types/request"
import {
    GenerateCvResponse,
} from "./graphql-types/response"
import {
    GenerateCvService,
} from "./generate-cv.service"

@Resolver()
/** GraphQL entry that authenticates before enqueueing CV generation. */
export class GenerateCvResolver {
    constructor(
        private readonly generateCvService: GenerateCvService,
    ) { }

    /**
     * Build a brand-new CV from the learner's free-text prompts. Creates a
     * `Pending` cv_generations run and enqueues the background build job
     * (mode = Generate); requires authentication. Poll `cvGeneration(id)` for
     * status + result.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV generation started successfully",
        [Locale.Vi]: "Đã bắt đầu tạo CV thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => GenerateCvResponse,
        {
            name: "generateCv",
            description: "Build a brand-new CV from the learner's free-text prompts.",
        },
    )
    async execute(
        @Args("request")
            request: GenerateCvRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ) {
        return this.generateCvService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
