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
    PlaygroundEntity,
} from "@modules/databases/postgresql/primary/entities/playground.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    PlaygroundResolverService,
} from "@modules/databases/postgresql/primary/resolvers/playground-resolver.service"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-optional-auth-graphql.guard"
import {
    PlaygroundsResponse,
    PlaygroundSummary,
} from "./graphql-types/response"

@Resolver()
/**
 * Lists a course's playgrounds (id/slug/title/icon/stepCount), in display
 * order. Optional auth: playground listing is readable by anonymous visitors
 * browsing a course page; `createPlaygroundSession` is what actually gates
 * on enrollment.
 */
export class PlaygroundsResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly playgroundResolver: PlaygroundResolverService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Playgrounds fetched successfully",
        [Locale.Vi]: "Lấy danh sách playground thành công", // vn-ok: vi-locale string emitted to clients
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
        @GraphQLLocale()
            locale: Locale,
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
                    translations: true,
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
                // only `title` is locale-projectable in the summary; resolve it
                // live to the request locale (falls back to the base column)
                title: this.playgroundResolver.resolveTitle(
                    playground,
                    locale,
                    Locale.En,
                ),
                icon: playground.icon,
                stepCount: playground.steps?.length ?? 0,
            }),
        )
    }
}
