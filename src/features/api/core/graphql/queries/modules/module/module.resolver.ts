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
    ModuleEntity,
} from "@modules/databases"
import {
    ModuleRequest,
    ModuleResponse,
} from "./graphql-types"
import {
    ModuleService,
} from "./module.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"

@Resolver(() => ModuleEntity)
/**
 * Login-only (not enrollment-gated) GraphQL entry for `module` — trial readers
 * may fetch a single module without lesson videos or challenges.
 */
export class ModuleResolver {
    constructor(
        private readonly moduleService: ModuleService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Module fetched successfully",
        [Locale.Vi]: "Lấy module thành công", // vn-ok: vi-locale string emitted to clients
    })
    // Enroll guard removed — logged-in users may fetch a single module for trial reading.
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ModuleResponse,
        {
            name: "module",
            description: "Returns a single module by primary id or display id (including nested contents, without lesson videos or challenges).",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Module lookup: provide id or displayId.",
            },
        )
            request: ModuleRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<ModuleEntity> {
        return this.moduleService.execute(
            {
                request,
                locale,
            },
        )
    }
}
