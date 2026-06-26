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
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    ProjectPinType,
    UserEntity,
    UserPinnedProjectEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    EnrollmentNotOwnedException,
    PinnedProjectLimitReachedException,
} from "@modules/exceptions"
import {
    PinCourseProjectRequest,
    PinCourseProjectResponse,
} from "./graphql-types"
import {
    MAX_PINNED_PROJECTS,
} from "./constants"

/**
 * Pin one of the current user's enrollment capstones (personal project) to their
 * public profile.
 *
 * The enrollment must belong to the caller; the title and URL are derived from
 * the enrollment/course server-side. A user may hold at most
 * {@link MAX_PINNED_PROJECTS} pins; the new pin is appended at the end of the
 * current list (`orderIndex` = current count).
 */
@Resolver()
export class PinCourseProjectResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Project pinned successfully",
        [Locale.Vi]: "Ghim dự án thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => PinCourseProjectResponse,
        {
            name: "pinCourseProject",
            description: "Pin one of the user's enrollment capstones to their profile.",
        },
    )
    async execute(
        @Args("request")
            request: PinCourseProjectRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<string> {
        // pull out the request fields once for readability
        const {
            enrollmentId,
            description,
            techStack,
        } = request

        // verify the enrollment exists AND belongs to the caller — otherwise a
        // user could pin someone else's capstone
        const enrollment = await this.entityManager.findOne(EnrollmentEntity,
            {
                where: {
                    id: enrollmentId,
                    // userId is a @RelationId (virtual, not queryable) — filter via
                    // the user relation's real FK column
                    user: {
                        id: user.id,
                    },
                },
            })

        // reject when the enrollment is missing or not owned by the user
        if (!enrollment) {
            throw new EnrollmentNotOwnedException({
                userId: user.id,
                enrollmentId,
            })
        }

        // count the user's existing pins to enforce the cap and compute the order
        // (scope via the user relation's FK — `userId` is a @RelationId, not a column)
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

        // persist the course pin; relations are set by id, the URL is copied from
        // the enrollment's project URL, and orderIndex appends it to the list end
        const saved = await this.entityManager.save(UserPinnedProjectEntity,
            {
                user: {
                    id: user.id,
                },
                type: ProjectPinType.Course,
                enrollment: {
                    id: enrollmentId,
                },
                description: description ?? null,
                url: enrollment.personalProjectGithubUrl,
                techStack: techStack ?? null,
                orderIndex: existingCount,
            })

        // return the new pin id (interceptor wraps it as `data`)
        return saved.id
    }
}
