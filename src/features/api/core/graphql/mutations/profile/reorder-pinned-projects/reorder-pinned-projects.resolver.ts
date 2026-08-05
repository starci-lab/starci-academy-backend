import {
    Args,
    Mutation,
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
    UserEntity,
    UserPinnedProjectEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    ReorderPinnedProjectsRequest,
    ReorderPinnedProjectsResponse,
} from "./graphql-types"

@Resolver()
/**
 * Reorder the current user's pinned projects.
 *
 * Each id's position in the request array becomes its new `orderIndex`. Every
 * update is scoped by both id and userId, so a caller can only reorder their own
 * pins — foreign or unknown ids simply update nothing. The updates run inside a
 * single transaction so the list never observes a partially-reordered state.
 */
export class ReorderPinnedProjectsResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Pinned projects reordered successfully",
        [Locale.Vi]: "Sắp xếp lại dự án đã ghim thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ReorderPinnedProjectsResponse,
        {
            name: "reorderPinnedProjects",
            description: "Reorder the user's pinned projects by id position.",
        },
    )
    async execute(
        @Args("request")
            request: ReorderPinnedProjectsRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ReorderPinnedProjectsResponse> {
        // the desired order — array position is the new orderIndex for each id
        const {
            ids,
        } = request

        // run every position update atomically so the list is never half-reordered
        await this.entityManager.transaction(async (transactionalEntityManager) => {
            // assign orderIndex = array position, one update per id
            for (const [orderIndex,
                id] of ids.entries()) {
                // scope by the user_id FK column so a caller can only reorder pins they
                // own; foreign / unknown ids match nothing and are silently skipped.
                // (`userId` is a @RelationId — not a real column — so it can't be used
                // directly in update criteria; filter on the FK column instead.)
                await transactionalEntityManager
                    .createQueryBuilder()
                    .update(UserPinnedProjectEntity)
                    .set({
                        orderIndex,
                    })
                    .where("id = :id", {
                        id,
                    })
                    .andWhere("user_id = :userId", {
                        userId: user.id,
                    })
                    .execute()
            }
        })

        // no payload — the client already holds the new order it submitted
        return {
        } as ReorderPinnedProjectsResponse
    }
}
