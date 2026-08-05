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
    ProjectPinType,
} from "@modules/databases/postgresql/primary/enums/project-pin-type"
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
    PinnedProjectLimitReachedException,
} from "@modules/platform/exceptions/errors/profile/pinned-project"
import {
    PinExternalProjectRequest,
} from "./graphql-types/request"
import {
    PinExternalProjectResponse,
} from "./graphql-types/response"
import {
    MAX_PINNED_PROJECTS,
} from "./constants"

@Resolver()
/**
 * Pin a free-form external project to the current user's public profile.
 *
 * Every field is user-authored and the pin is never verified. A user may hold at
 * most {@link MAX_PINNED_PROJECTS} pins; the new pin is appended at the end of
 * the current list (`orderIndex` = current count).
 */
export class PinExternalProjectResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Project pinned successfully",
        [Locale.Vi]: "Ghim dự án thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => PinExternalProjectResponse,
        {
            name: "pinExternalProject",
            description: "Pin a free-form external project to the user's profile.",
        },
    )
    async execute(
        @Args("request")
            request: PinExternalProjectRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<string> {
        // pull out the request fields once for readability
        const {
            title,
            description,
            url,
            techStack,
        } = request

        // count the user's existing pins to enforce the cap and compute the order
        // (scope via the user relation's FK -- `userId` is a @RelationId, not a column)
        const existingCount = await this.entityManager.count(UserPinnedProjectEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                },
            })

        // reject when the user already holds the maximum number of pins
        if (existingCount >= MAX_PINNED_PROJECTS) {
            throw new PinnedProjectLimitReachedException({
                userId: user.id,
                maxPins: MAX_PINNED_PROJECTS,
            })
        }

        // persist the external pin; relation is set by id, all content fields are
        // user-authored, and orderIndex appends it to the end of the list
        const saved = await this.entityManager.save(UserPinnedProjectEntity,
            {
                user: {
                    id: user.id,
                },
                type: ProjectPinType.External,
                enrollment: null,
                title,
                description: description ?? null,
                url: url ?? null,
                techStack: techStack ?? null,
                orderIndex: existingCount,
            })

        // return the new pin id (interceptor wraps it as `data`)
        return saved.id
    }
}
