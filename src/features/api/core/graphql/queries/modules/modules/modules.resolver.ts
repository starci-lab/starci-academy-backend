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
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    ModulesRequest,
    ModulesResponse,
    ModulesResponseData,
} from "./graphql-types"
import {
    ModulesService,
} from "./modules.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"

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
