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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserPinnedProjectEntity,
} from "@modules/databases/postgresql/primary/entities/user-pinned-project.entity"
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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    PinnedProjectNotOwnedException,
} from "@modules/platform/exceptions/errors/profile/pinned-project"
import {
    UnpinProjectRequest,
} from "./graphql-types/request"
import {
    UnpinProjectResponse,
} from "./graphql-types/response"

@Resolver()
/**
 * Remove one of the current user's pinned projects.
 *
 * The pin must belong to the caller -- the delete is scoped by both id and
 * userId, and an unaffected delete (the pin does not exist or is owned by
 * someone else) surfaces a typed exception rather than silently succeeding.
 */
export class UnpinProjectResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Project unpinned successfully",
        [Locale.Vi]: "Bỏ ghim dự án thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => UnpinProjectResponse,
        {
            name: "unpinProject",
            description: "Remove one of the user's pinned projects.",
        },
    )
    async execute(
        @Args("request")
            request: UnpinProjectRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<UnpinProjectResponse> {
        // pull out the target pin id
        const {
            id,
        } = request

        // delete scoped by both id AND the user_id FK so a user can only remove their
        // own pins; capture the affected count to detect a missing / foreign pin.
        // (`userId` is a @RelationId -- not a real column -- so it can't be used directly
        // in delete criteria; filter on the FK column instead.)
        const result = await this.entityManager
            .createQueryBuilder()
            .delete()
            .from(UserPinnedProjectEntity)
            .where("id = :id",
                {
                    id,
                })
            .andWhere("user_id = :userId",
                {
                    userId: user.id,
                })
            .execute()

        // zero affected rows means the pin did not exist or is not owned by the user
        if (!result.affected) {
            throw new PinnedProjectNotOwnedException({
                userId: user.id,
                pinId: id,
            })
        }

        // no payload -- the client removes the pin from its local list optimistically
        return {
        } as UnpinProjectResponse
    }
}
