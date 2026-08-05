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
    MilestonesRequest,
} from "./graphql-types/request"
import {
    MilestonesResponse,
    MilestonesResponseData,
} from "./graphql-types/response"
import {
    MilestonesService,
} from "./milestones.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness/guards/graphql-must-enrolled.guard"

@Resolver()
/**
 * Auth + enrollment-gated GraphQL entry for `milestones` -- full course outline
 * ordered by `sortIndex`.
 */
export class MilestonesResolver {
    constructor(
        private readonly milestonesService: MilestonesService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Milestones fetched successfully",
        [Locale.Vi]: "Lấy danh sách milestone thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MilestonesResponse,
        {
            name: "milestones",
            description: "Returns all milestones for a course, ordered by orderIndex.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Course id to fetch milestones for.",
            },
        )
            request: MilestonesRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<MilestonesResponseData> {
        return this.milestonesService.execute(
            {
                request,
                locale,
            },
        )
    }
}
