import {
    Args,
    Query,
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
    CvGenerationRequest,
} from "./graphql-types/request"
import {
    CvGenerationResponse,
    CvGenerationPayload,
} from "./graphql-types/response"
import {
    CvGenerationService,
} from "./cv-generation.service"

@Resolver()
/**
 * GraphQL entry for `cvGeneration`: one owned run with structured data,
 * LaTeX source, and presigned file URLs. Auth required.
 */
export class CvGenerationResolver {
    constructor(
        private readonly cvGenerationService: CvGenerationService,
    ) { }

    /**
     * Fetch a single CV generation run by id (must belong to the caller).
     * Exposes `structuredData` as a JSON scalar and `latexSource` -- the raw
     * `.tex` text resolved server-side from MinIO; requires authentication.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "CV generation fetched successfully",
        [Locale.Vi]: "Lấy CV đã tạo thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CvGenerationResponse,
        {
            name: "cvGeneration",
            description: "Fetch a single CV generation run by id (with structured data + LaTeX source).",
        },
    )
    async execute(
        @Args("request")
            request: CvGenerationRequest,
        @GraphQLLocale()
            locale: Locale,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CvGenerationPayload> {
        return this.cvGenerationService.execute(
            {
                request,
                locale,
                user,
            },
        )
    }
}
