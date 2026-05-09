import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    Injectable,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    Locale,
    MilestoneEntity,
    UserEntity,
} from "@modules/databases"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
    GraphQLLocale,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    CacheKey,
    GraphQLCacheInterceptor,
    GraphQLCacheResponse,
} from "@modules/cache"
import {
    MilestonesRequest,
    MilestonesResponse,
} from "./graphql-types"
import {
    MilestonesService,
} from "./milestones.service"

@Resolver(() => MilestoneEntity)
@Injectable()
export class MilestonesResolver {
    constructor(
        private readonly milestonesService: MilestonesService,
    ) { }

    /**
     * Returns all milestones for a user's enrollment in a course.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Milestones fetched successfully",
        [Locale.Vi]: "Lấy milestones thành công",
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @GraphQLCacheResponse({
        key: CacheKey.EnrollmentMilestones,
        argsExtractor: (request, user) => [
            request?.courseId,
            user?.id
        ],
    })
    @UseInterceptors(
        GraphQLCacheInterceptor,
        GraphQLTransformInterceptor,
    )
    @Query(() => MilestonesResponse,
        {
            name: "milestones",
            description: "Returns all milestones for the current user's enrollment in a course.",
        })
    async execute(
        @Args("request",
            {
                description: "Milestones lookup request.",
            }
        )
            request: MilestonesRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<Array<MilestoneEntity>> {
        return this.milestonesService.execute(
            {
                request,
                user,
                locale,
            },
        )
    }
}
