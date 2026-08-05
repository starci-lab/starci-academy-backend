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
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ModuleRequest,
} from "./graphql-types/request"
import {
    ModuleResponse,
} from "./graphql-types/response"
import {
    ModuleService,
} from "./module.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"

@Resolver(() => ModuleEntity)
/**
 * Login-only (not enrollment-gated) GraphQL entry for `module` -- trial readers
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
    // Enroll guard removed -- logged-in users may fetch a single module for trial reading.
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
