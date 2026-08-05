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
    MilestonesRequest,
    MilestonesResponse,
    MilestonesResponseData,
} from "./graphql-types"
import {
    MilestonesService,
} from "./milestones.service"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"

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
