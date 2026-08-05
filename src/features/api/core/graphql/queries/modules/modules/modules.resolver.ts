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
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ModulesRequest,
} from "./graphql-types/request"
import {
    ModulesResponse,
    ModulesResponseData,
} from "./graphql-types/response"
import {
    ModulesService,
} from "./modules.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"

@Resolver()
/**
 * Login-only (not enrollment-gated) GraphQL entry for `modules` -- trial readers
 * may browse a course's module list.
 */
export class ModulesResolver {
    constructor(
        private readonly modulesService: ModulesService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Modules fetched successfully",
        [Locale.Vi]: "Lấy danh sách module thành công", // vn-ok: vi-locale string emitted to clients
    })
    // Enroll guard removed -- logged-in users may browse module list for trial reading.
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ModulesResponse,
        {
            name: "modules",
            description: "Lists modules for a course with page-based pagination.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Course id, pagination, and sort request.",
            },
        )
            request: ModulesRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<ModulesResponseData> {
        return this.modulesService.execute(
            {
                request,
                locale,
            },
        )
    }
}
