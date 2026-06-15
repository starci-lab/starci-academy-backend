import {
    Args,
    Context,
    ID,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    CodingProgressService,
} from "@modules/bussiness"
import {
    type MyCodingProgressResponseData,
} from "../../coding/my-coding-progress/graphql-types"
import {
    isProfileHiddenFromViewer,
} from "../utils"
import {
    UserCodingProgressResponse,
} from "./graphql-types"

/**
 * Public profile query: a given user's coding-practice status (solved / attempted
 * / revealed problem ids + total points). Mirrors `myCodingProgress` but reads for
 * the user named in the route (id from args), so a profile can show a coding tab.
 * Optional auth — anonymous viewers may call it. A locked profile yields empty
 * progress to anyone but the owner (also gated client-side).
 */
@Resolver()
export class UserCodingProgressResolver {
    constructor(
        private readonly codingProgressService: CodingProgressService,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Coding progress fetched successfully",
        [Locale.Vi]: "Lấy tiến độ thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserCodingProgressResponse,
        {
            name: "userCodingProgress",
            description: "A user's coding status: solved/attempted/revealed ids + total points, by user id.",
        },
    )
    async execute(
        @Args(
            "userId",
            {
                type: () => ID,
                description: "Id of the user whose coding progress to fetch.",
            },
        )
            userId: string,
        @Context()
            context: { req?: { user?: { id?: string } } },
    ): Promise<MyCodingProgressResponseData> {
        // locked profile → withhold the coding stats from everyone but the owner
        if (await isProfileHiddenFromViewer({
            entityManager: this.entityManager,
            userId,
            viewerId: context.req?.user?.id,
        })) {
            // empty progress for a hidden profile
            return {
                solvedProblemIds: [],
                attemptedProblemIds: [],
                revealedProblemIds: [],
                totalPoints: 0,
            }
        }
        // cached per-user progress (computed on miss, invalidated on submit)
        return this.codingProgressService.getProgress({
            userId,
        })
    }
}
