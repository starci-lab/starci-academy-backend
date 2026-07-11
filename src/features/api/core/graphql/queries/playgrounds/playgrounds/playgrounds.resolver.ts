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
import type {
    EntityManager,
} from "typeorm"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    PlaygroundEntity,
} from "@modules/databases"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    PlaygroundsResponse,
    PlaygroundSummary,
} from "./graphql-types"

/**
 * Lists a course's playgrounds (id/slug/title/icon/stepCount), in display
 * order. Optional auth: playground listing is readable by anonymous visitors
 * browsing a course page; `createPlaygroundSession` is what actually gates
 * on enrollment.
 */
@Resolver()
export class PlaygroundsResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Playgrounds fetched successfully",
        [Locale.Vi]: "Lấy danh sách playground thành công",
    })
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => PlaygroundsResponse,
        {
            name: "playgrounds",
            description: "Lists a course's playgrounds (id/slug/title/icon/stepCount), in display order.",
        },
    )
    async execute(
        @Args(
            "courseId",
            {
                type: () => ID,
                description: "Course whose playgrounds to list.",
            },
        )
            courseId: string,
    ): Promise<Array<PlaygroundSummary>> {
        const playgrounds = await this.entityManager.find(
            PlaygroundEntity,
            {
                where: {
                    course: {
                        id: courseId,
                    },
                },
                relations: {
                    steps: true,
                },
                order: {
                    sortIndex: "ASC",
                },
            },
        )
        return playgrounds.map(
            (playground): PlaygroundSummary => ({
                id: playground.id,
                slug: playground.slug,
                title: playground.title,
                icon: playground.icon,
                stepCount: playground.steps?.length ?? 0,
            }),
        )
    }
}
