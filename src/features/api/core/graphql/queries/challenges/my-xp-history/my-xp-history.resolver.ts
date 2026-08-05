import {
    Args,
    ID,
    Int,
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
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserEntity,
    XpHistoryEntity,
} from "@modules/databases"
import type {
    EntityManager,
    FindOptionsWhere,
} from "typeorm"
import {
    MyXpHistoryResponse,
    MyXpHistoryResponseData,
} from "./graphql-types"

/** Hard ceiling on page size to keep the query cheap. */
const MAX_LIMIT = 200

@Resolver()
/**
 * Per-user XP-earning history (newest first), paginated, optionally scoped to one course.
 * Source of truth is `xp_histories`; read directly (not cached) since the history is viewed
 * on demand, not on a hot path.
 */
export class MyXpHistoryResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "XP history fetched successfully",
        [Locale.Vi]: "Lấy lịch sử XP thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyXpHistoryResponse,
        {
            name: "myXpHistory",
            description:
                "Returns the authenticated user's paginated XP-earning history "
                + "(newest first) from xp_histories, optionally scoped to one course.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args("limit",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 50,
            })
            limit: number,
        @Args("offset",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 0,
            })
            offset: number,
        @Args("courseId",
            {
                type: () => ID,
                nullable: true,
            })
            courseId?: string,
    ): Promise<MyXpHistoryResponseData> {
        // scope to the caller, optionally to one course
        const where: FindOptionsWhere<XpHistoryEntity> = {
            user: {
                id: user.id,
            },
            ...(courseId ? {
                course: {
                    id: courseId,
                },
            } : {
            }),
        }
        const [rows,
            total] = await this.entityManager.findAndCount(
            XpHistoryEntity,
            {
                where,
                order: {
                    createdAt: "DESC",
                },
                take: Math.min(Math.max(limit ?? 50,
                    1),
                MAX_LIMIT),
                skip: Math.max(offset ?? 0,
                    0),
            },
        )
        return {
            items: rows.map((row) => ({
                id: row.id,
                source: row.source,
                amount: row.amount,
                points: row.points,
                courseId: row.courseId,
                createdAt: row.createdAt,
            })),
            total,
        }
    }
}
