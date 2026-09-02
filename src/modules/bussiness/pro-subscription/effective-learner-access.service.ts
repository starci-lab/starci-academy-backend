import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    MembershipEntity,
} from "@modules/databases/postgresql/primary/entities/membership.entity"
import {
    MembershipStatus,
} from "@modules/databases/postgresql/primary/enums/membership-status"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    In,
} from "typeorm"
import {
    ProSubscriptionService,
} from "./pro-subscription.service"

/** Effective access flags and the entitlement source chosen for each domain. */
export interface EffectiveLearnerAccess {
    proActive: boolean
    course: boolean
    community: boolean
    premiumBlog: boolean
    globalChat: boolean
    ai: boolean
    mockInterview: boolean
    courseSource: string
    communitySource: string
    aiSource: string
}

/** Course access decision without conflating Pro access with a factual enrollment. */
export interface EffectiveCourseAccess {
    allowed: boolean
    proActive: boolean
    enrolled: boolean
    source: "pro" | "legacy-enrollment" | "none"
}

@Injectable()
/** Read-only composition of legacy rights plus the new Pro entitlement. */
export class EffectiveLearnerAccessService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
        private readonly proSubscriptionService: ProSubscriptionService,
    ) {}

    /**
     * Resolve paid course access while preserving enrollment as factual progress state.
     * Pro does not create an enrollment; consumers use `allowed` for authorization and
     * `enrolled` only when they need to report the underlying enrollment fact.
     */
    async resolveCourseAccess(
        userId: string,
        courseId: string,
    ): Promise<EffectiveCourseAccess> {
        return (await this.resolveCourseAccesses(userId,
            [courseId])).get(courseId)!
    }

    /** Resolve a page of course decisions with one Pro read and one enrollment read. */
    async resolveCourseAccesses(
        userId: string,
        courseIds: Array<string>,
    ): Promise<Map<string, EffectiveCourseAccess>> {
        const uniqueCourseIds = [...new Set(courseIds)]
        if (uniqueCourseIds.length === 0) {
            return new Map()
        }
        const [proActive,
            enrollments] = await Promise.all([
            this.isProActive(userId),
            this.entityManager.find(EnrollmentEntity,
                {
                    where: {
                        user: {
                            id: userId,
                        },
                        course: {
                            id: In(uniqueCourseIds),
                        },
                        isEnrolled: true,
                    },
                }),
        ])
        const enrolledCourseIds = new Set(enrollments.map((enrollment) => enrollment.courseId))
        return new Map(uniqueCourseIds.map((courseId) => {
            const enrolled = enrolledCourseIds.has(courseId)
            return [courseId,
                {
                    allowed: proActive || enrolled,
                    proActive,
                    enrolled,
                    source: proActive ? "pro" : enrolled ? "legacy-enrollment" : "none",
                }]
        }))
    }

    /** Course authorization shortcut for enforcement-only consumers. */
    async hasCourseAccess(userId: string, courseId: string): Promise<boolean> {
        return (await this.resolveCourseAccess(userId,
            courseId)).allowed
    }

    /** Active state from the dedicated Pro aggregate, exposed through one consumer authority. */
    async isProActive(userId: string): Promise<boolean> {
        return this.proSubscriptionService.isActive(userId)
    }

    /** Community, premium-blog and global-chat access from Pro or legacy membership. */
    async hasCommunityAccess(userId: string): Promise<boolean> {
        const [proActive,
            membership] = await Promise.all([
            this.isProActive(userId),
            this.entityManager.findOne(MembershipEntity,
                {
                    where: {
                        user: {
                            id: userId,
                        },
                    },
                }),
        ])
        return proActive || this.isLegacyMembershipActive(membership)
    }

    async resolve(userId: string, courseId?: string): Promise<EffectiveLearnerAccess> {
        const [courseAccess,
            membership] = await Promise.all([
            courseId
                ? this.resolveCourseAccess(userId,
                    courseId)
                : this.proSubscriptionService.isActive(userId).then((proActive) => ({
                    allowed: proActive,
                    proActive,
                    enrolled: false,
                    source: proActive ? "pro" as const : "none" as const,
                })),
            this.hasCommunityAccess(userId),
        ])
        const { proActive } = courseAccess
        const course = courseAccess.allowed
        const community = membership
        return {
            proActive,
            course,
            community,
            premiumBlog: community,
            globalChat: community,
            ai: true,
            mockInterview: course,
            courseSource: courseAccess.source,
            communitySource: proActive ? "pro" : community ? "legacy-membership" : "none",
            aiSource: proActive ? "pro" : "legacy-or-free",
        }
    }

    private isLegacyMembershipActive(membership: MembershipEntity | null): boolean {
        return Boolean(
            membership?.currentPeriodEnd
            && membership.status !== MembershipStatus.Expired
            && this.dayjsService.from(membership.currentPeriodEnd).isAfter(this.dayjsService.now()),
        )
    }
}
