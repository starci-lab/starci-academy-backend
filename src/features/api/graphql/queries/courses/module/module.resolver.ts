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
    KeycloakAuthGraphQLGuard 
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard 
} from "@modules/bussiness"

@Resolver(() => ModuleEntity)
export class ModuleResolver {
    constructor(
        private readonly moduleService: ModuleService,
    ) {}

    /**
     * Returns a single module by id.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Module fetched successfully",
        [Locale.Vi]: "Lấy module thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ModuleResponse,
        {
            description: "Returns a single module by id.",
        },
    )
    async module(
        @Args(
            "request",
            {
                description: "Module lookup request.",
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

