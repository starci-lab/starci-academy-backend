import {
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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CodingProgressService,
} from "@modules/bussiness/coding/coding-progress.service"
import {
    UserCodingProjectionService,
} from "@modules/bussiness/projections/user-coding/user-coding-projection.service"
import {
    CodingDomain,
} from "@modules/databases/postgresql/primary/enums/coding-domain"
import {
    MyCodingProgressResponse,
    type MyCodingProgressResponseData,
} from "./graphql-types/response"

@Resolver()
/**
 * Returns the authenticated user's coding-practice status (solved/attempted/
 * revealed ids + total points) from the Redis-cached progress -- decoupled from
 * the shared `codingProblems` catalog (served from Elasticsearch).
 */
export class MyCodingProgressResolver {
    constructor(
        private readonly codingProgressService: CodingProgressService,
        private readonly userCodingProjectionService: UserCodingProjectionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Coding progress fetched successfully",
        [Locale.Vi]: "Lấy tiến độ thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyCodingProgressResponse,
        {
            name: "myCodingProgress",
            description: "The user's coding status: solved/attempted/revealed ids, total points, and solved counts per domain.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<MyCodingProgressResponseData> {
        /*
         * TWO SOURCES, COMPOSED HERE, AND THAT IS DELIBERATE.
         *
         * The ids and the points come from the progress cache, which computes them on a miss and is
         * invalidated on submit. The per-domain rollup comes from the coding PROJECTION, which
         * already runs exactly that GROUP BY for the public profile query.
         *
         * The alternative was a fourth SELECT inside `CodingProgressService.compute`, and it was
         * refused for two reasons: it would duplicate, character for character, the SQL already in
         * `UserCodingProjectionService.buildUpsertSql`, and it would stack two staleness policies
         * over one number -- the progress cache's and the projection's TTL.
         *
         * They are read in parallel because neither depends on the other.
         */
        const [progress,
            skills] = await Promise.all([
            this.codingProgressService.getProgress({
                userId: user.id,
            }),
            this.userCodingProjectionService.getSkills(user.id),
        ])

        return {
            ...progress,
            // a domain with no solves has no bucket, which is the shape the response documents
            byDomain: skills.byDomain.map((bucket) => ({
                domain: bucket.key as CodingDomain,
                solved: bucket.solved,
            })),
        }
    }
}
