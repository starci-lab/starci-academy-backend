import {
    Injectable,
} from "@nestjs/common"
import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    EnrollmentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserEntity,
    UserMilestoneTaskAttemptEntity,
    UserMilestoneTaskEntity,
} from "@modules/databases"
import {
    PersonalTaskAttemptAccessDeniedException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    type EntityManager,
} from "typeorm"
import {
    LastPersonalTaskAttemptQuery,
} from "./last-personal-task-attempt.query"
import {
    LastPersonalTaskAttemptResponseData,
} from "./graphql-types"

/**
 * Keycloak realm roles that may read another user's last personal-task attempt.
 */
const REALM_ROLES_ALLOWED_TO_VIEW_OTHER_USER = new Set(
    [
        "instructor",
        "admin",
        "mentor",
    ],
)

const callerMayViewAttempt = (
    caller: UserEntity,
    subjectUserId: string,
    realmRoles: Array<string>,
): boolean => {
    if (caller.id === subjectUserId) {
        return true
    }
    return realmRoles.some((role) => REALM_ROLES_ALLOWED_TO_VIEW_OTHER_USER.has(role))
}

@QueryHandler(LastPersonalTaskAttemptQuery)
@Injectable()
export class LastPersonalTaskAttemptHandler
    extends ICQRSHandler<LastPersonalTaskAttemptQuery, LastPersonalTaskAttemptResponseData>
    implements IQueryHandler<LastPersonalTaskAttemptQuery, LastPersonalTaskAttemptResponseData> {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        query: LastPersonalTaskAttemptQuery,
    ): Promise<LastPersonalTaskAttemptResponseData> {
        const {
            user,
            request: {
                courseId,
                taskId,
                userId: subjectUserId,
            },
            keycloakToken,
        } = query.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        const realmRoles = keycloakToken?.realm_access?.roles ?? []
        if (!callerMayViewAttempt(
            user,
            subjectUserId,
            realmRoles,
        )) {
            throw new PersonalTaskAttemptAccessDeniedException({
                callerId: user.id,
                subjectUserId,
            })
        }
        const enrollment = await this.entityManager.findOne(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: subjectUserId,
                    },
                    course: {
                        id: courseId,
                    },
                },
                select: {
                    id: true,
                },
            },
        )
        if (!enrollment) {
            return {
                attempt: null,
            }
        }
        const userMilestoneTask = await this.entityManager.findOne(
            UserMilestoneTaskEntity,
            {
                where: {
                    enrollment: {
                        id: enrollment.id,
                    },
                    milestoneTask: {
                        id: taskId,
                    },
                },
                select: {
                    id: true,
                },
            },
        )
        if (!userMilestoneTask) {
            return {
                attempt: null,
            }
        }
        const attempt = await this.entityManager.findOne(
            UserMilestoneTaskAttemptEntity,
            {
                where: {
                    userMilestoneTask: {
                        id: userMilestoneTask.id,
                    },
                },
                order: {
                    attemptNumber: "DESC",
                },
            },
        )
        return {
            attempt: attempt ?? null,
        }
    }
}
