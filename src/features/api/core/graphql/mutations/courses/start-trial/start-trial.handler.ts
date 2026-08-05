import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    type EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    EnrollmentEntity,
    CourseEntity,
    PricingPhase,
} from "@modules/databases"
import {
    CourseNotFoundException,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    StartTrialCommand,
} from "./start-trial.command"
import type {
    StartTrialResponseData,
} from "./graphql-types"

@CommandHandler(StartTrialCommand)
@Injectable()
/**
 * Creates a TRIAL (preview) enrollment for a course: a real `enrollments` row
 * with `is_enrolled = false`. This lets the learner's activity (lesson reads,
 * challenge submissions) be aggregated per-course and surface in "my courses",
 * while paid-only gates (capstone / milestone / personal-project / premium) stay
 * locked until they actually enroll (the must-enrolled gate checks
 * `is_enrolled = true`). Idempotent: if any enrollment row already exists (trial
 * or real) it is a no-op, returning that row's flag.
 */
export class StartTrialHandler
    extends ICQRSHandler<StartTrialCommand, StartTrialResponseData>
    implements ICommandHandler<StartTrialCommand, StartTrialResponseData>
{
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {
        super()
    }

    protected override async process(
        command: StartTrialCommand,
    ): Promise<StartTrialResponseData> {
        const {
            request: {
                courseId,
            },
            user,
        } = command.params
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // course must exist (and we read the current pricing phase as a placeholder --
        // the real phase is locked when the trial converts to a paid enrollment)
        const course = await this.entityManager.findOne(
            CourseEntity,
            {
                where: {
                    id: courseId,
                },
                relations: {
                    metadata: true,
                },
            },
        )
        if (!course) {
            throw new CourseNotFoundException({
                id: courseId,
            })
        }
        // idempotent: a trial row OR a real enrollment already exists -> no-op
        const existing = await this.entityManager.findOne(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                    course: {
                        id: courseId,
                    },
                },
            },
        )
        if (existing) {
            return {
                isEnrolled: existing.isEnrolled,
            }
        }
        // create the TRIAL placeholder (is_enrolled = false)
        try {
            const enrollment = this.entityManager.create(
                EnrollmentEntity,
                {
                    user: {
                        id: user.id,
                    },
                    course: {
                        id: courseId,
                    },
                    pricingPhase: course.metadata?.currentPhase ?? PricingPhase.EarlyBird,
                    isEnrolled: false,
                },
            )
            await this.entityManager.save(enrollment)
        } catch {
            // UQ_enrollments_user_course race: another concurrent request created it
            // first -> idempotent, return whatever now exists
            const raced = await this.entityManager.findOne(
                EnrollmentEntity,
                {
                    where: {
                        user: {
                            id: user.id,
                        },
                        course: {
                            id: courseId,
                        },
                    },
                },
            )
            return {
                isEnrolled: raced?.isEnrolled ?? false,
            }
        }
        return {
            isEnrolled: false,
        }
    }
}
