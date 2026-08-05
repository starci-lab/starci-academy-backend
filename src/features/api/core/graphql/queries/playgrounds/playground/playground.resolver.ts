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
    PlaygroundNotFoundException,
} from "@modules/platform/exceptions/errors/courses/playground-not-found"
import {
    PlaygroundResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Returns a single playground by slug with its ordered steps (learner-facing
 * fields only -- verify secrets are never exposed, see {@link PlaygroundResponse}).
 */
export class PlaygroundResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly playgroundResolver: PlaygroundResolverService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Playground fetched successfully",
        [Locale.Vi]: "Lấy playground thành công", // vn-ok: vi-locale string emitted to clients
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
        @GraphQLLocale()
            locale: Locale,
    ): Promise<PlaygroundEntity> {
        const playground = await this.entityManager.findOne(
            PlaygroundEntity,
            {
                where: {
                    slug,
                },
                relations: {
                    translations: true,
                    steps: {
                        translations: true,
                    },
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
        // project title/description (playground) + title/body (each step) to the
        // request locale and strip the raw translation rows before returning
        this.playgroundResolver.transform(
            playground,
            locale,
            Locale.En,
        )
        return playground
    }
}
