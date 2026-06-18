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
    PinnedProjectNotOwnedException,
} from "@modules/exceptions"
import {
    UnpinProjectRequest,
    UnpinProjectResponse,
} from "./graphql-types"

/**
 * Remove one of the current user's pinned projects.
 *
 * The pin must belong to the caller — the delete is scoped by both id and
 * userId, and an unaffected delete (the pin does not exist or is owned by
 * someone else) surfaces a typed exception rather than silently succeeding.
 */
@Resolver()
export class UnpinProjectResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Project unpinned successfully",
        [Locale.Vi]: "Bỏ ghim dự án thành công",
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

        // delete scoped by both id AND userId so a user can only remove their own
        // pins; capture the affected count to detect a missing / foreign pin
        const result = await this.entityManager.delete(UserPinnedProjectEntity,
            {
                id,
                userId: user.id,
            })

        // zero affected rows means the pin did not exist or is not owned by the user
        if (!result.affected) {
            throw new PinnedProjectNotOwnedException({
                userId: user.id,
                pinId: id,
            })
        }

        // no payload — the client removes the pin from its local list optimistically
        return {
        } as UnpinProjectResponse
    }
}
