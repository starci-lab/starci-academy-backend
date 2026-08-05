import {
    Args,
    Int,
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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-optional-auth-graphql.guard"
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
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    OpenToWorkUsersResponse,
} from "./graphql-types/response"

/** Hard cap on page size to bound the directory query regardless of client input. */
const MAX_LIMIT = 48

@Resolver()
/**
 * Public "talent directory" query: users who opted into "open to work", newest
 * first, for recruiters / headhunters to browse. Optional auth -- anyone may
 * browse (the listed users opted in to being discoverable). NOT behind the
 * profile-visibility guard: it lists only the public header fields, and each card
 * links to the user's profile (which enforces its own lock). Offset-paginated.
 */
export class OpenToWorkUsersResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Open-to-work users fetched successfully",
        [Locale.Vi]: "Lấy danh sách ứng viên thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => OpenToWorkUsersResponse,
        {
            name: "openToWorkUsers",
            description: "Users who opted into 'open to work', newest first (talent directory).",
        },
    )
    async execute(
        @Args(
            "limit",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 24,
                description: "Max users per page.",
            },
        )
            limit: number,
        @Args(
            "offset",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 0,
                description: "Rows to skip (offset pagination).",
            },
        )
            offset: number,
    ): Promise<Array<UserEntity>> {
        // clamp page size; never trust the client with an unbounded scan
        const take = Math.min(Math.max(limit ?? 24,
            1),
        MAX_LIMIT)
        const skip = Math.max(offset ?? 0,
            0)
        // newest open-to-work, non-deleted users; resolved fields fill counts
        return this.entityManager.find(
            UserEntity,
            {
                where: {
                    openToWork: true,
                    isDeleted: false,
                },
                order: {
                    createdAt: "DESC",
                },
                take,
                skip,
            },
        )
    }
}
