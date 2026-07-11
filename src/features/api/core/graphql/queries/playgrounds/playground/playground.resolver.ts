import {
    Args,
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
    PlaygroundNotFoundException,
} from "@modules/exceptions"
import {
    PlaygroundResponse,
} from "./graphql-types"

/**
 * Returns a single playground by slug with its ordered steps (learner-facing
 * fields only — verify secrets are never exposed, see {@link PlaygroundResponse}).
 */
@Resolver()
export class PlaygroundResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Playground fetched successfully",
        [Locale.Vi]: "Lấy playground thành công",
    })
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => PlaygroundResponse,
        {
            name: "playground",
            description: "Returns a single playground by slug with its ordered steps.",
        },
    )
    async execute(
        @Args(
            "slug",
            {
                type: () => String,
                description: "Playground slug to fetch.",
            },
        )
            slug: string,
    ): Promise<PlaygroundEntity> {
        const playground = await this.entityManager.findOne(
            PlaygroundEntity,
            {
                where: {
                    slug,
                },
                relations: {
                    steps: true,
                },
                order: {
                    steps: {
                        sortIndex: "ASC",
                    },
                },
            },
        )
        if (!playground) {
            throw new PlaygroundNotFoundException({
                slug,
            })
        }
        return playground
    }
}
