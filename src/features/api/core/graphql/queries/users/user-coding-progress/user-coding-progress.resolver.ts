import {
    Args,
    ID,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
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
    Locale,
} from "@modules/databases"
import {
    CodingProgressService,
    GraphQLProfileVisibilityGuard,
} from "@modules/bussiness"
import {
    type MyCodingProgressResponseData,
} from "../../coding/my-coding-progress/graphql-types"
import {
    UserCodingProgressResponse,
} from "./graphql-types"

@Resolver()
/**
 * Public profile query: a given user's coding-practice status (solved / attempted
 * / revealed problem ids + total points). Mirrors `myCodingProgress` but reads for
 * the user named in the route (id from args), so a profile can show a coding tab.
 * Optional auth -- anonymous viewers may call it; a locked profile is withheld from
 * non-owners by {@link GraphQLProfileVisibilityGuard}.
 */
export class UserCodingProgressResolver {
    constructor(
        private readonly codingProgressService: CodingProgressService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard,
        GraphQLProfileVisibilityGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Coding progress fetched successfully",
        [Locale.Vi]: "Lấy tiến độ thành công", // vn-ok: vi-locale string emitted to clients
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
    ): Promise<MyCodingProgressResponseData> {
        // cached per-user progress (computed on miss, invalidated on submit)
        return this.codingProgressService.getProgress({
            userId,
        })
    }
}
