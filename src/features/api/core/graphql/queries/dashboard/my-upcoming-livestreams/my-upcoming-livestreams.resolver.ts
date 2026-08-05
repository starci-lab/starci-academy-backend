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
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
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
    LivestreamSessionResolverService,
} from "@modules/databases/postgresql/primary/resolvers/livestream-session-resolver.service"
import {
    toGlobalId,
} from "@modules/platform/routing/utils/global-id"
import {
    UpcomingLivestreamData,
    MyUpcomingLivestreamsResponse,
} from "./graphql-types/response"
import {
    nextWeeklyOccurrence,
} from "./utils/next-occurrence"

/** Default + hard-cap on how many upcoming livestreams to surface. */
const DEFAULT_LIMIT = 3
/** Upper bound so the client can never ask for an unbounded list. */
const MAX_LIMIT = 20

@Resolver()
/**
 * Dashboard rail: the viewer's soonest upcoming livestreams across the courses
 * they are enrolled in. Livestream slots are recurring weekly templates (weekday
 * + wall-clock start/end), so for each slot we compute the next concrete
 * occurrence on or after now, sort the whole set ascending, and return the
 * earliest few. Auth-only (the set is the viewer's own enrollments).
 */
export class MyUpcomingLivestreamsResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly livestreamSessionResolver: LivestreamSessionResolverService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Upcoming livestreams fetched successfully",
        [Locale.Vi]: "Lấy lịch livestream sắp tới thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyUpcomingLivestreamsResponse,
        {
            name: "myUpcomingLivestreams",
            description: "The viewer's soonest upcoming livestreams across enrolled courses.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
        @Args(
            "limit",
            {
                type: () => Int,
                nullable: true,
                defaultValue: DEFAULT_LIMIT,
                description: "Max upcoming livestreams to return.",
            },
        )
            limit: number,
    ): Promise<Array<UpcomingLivestreamData>> {
        // clamp the page size into [1, MAX_LIMIT]
        const take = Math.min(Math.max(limit ?? DEFAULT_LIMIT,
            1),
        MAX_LIMIT)

        // load the viewer's enrollments, each with its course and the course's
        // recurring livestream slots (+ note translations for localized titles)
        const enrollments = await this.entityManager.find(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: user.id,
                    },
                },
                relations: {
                    course: {
                        livestreamSessions: {
                            translations: true,
                        },
                    },
                },
            },
        )

        // single "now" reference so every next-occurrence is computed against the
        // same instant (avoids drift across many slots)
        const now = new Date()

        // flatten every enrolled course's slots into concrete upcoming occurrences
        const upcoming: Array<UpcomingLivestreamData> = []
        for (const enrollment of enrollments) {
            const course = enrollment.course
            // defensive: skip orphan enrollments with no hydrated course
            if (!course) {
                continue
            }
            // courses with no livestream schedule contribute nothing
            const sessions = course.livestreamSessions ?? []
            // fall back to the course's default locale when the viewer's is missing
            const fallbackLocale = course.defaultLocale ?? Locale.En
            for (const session of sessions) {
                // overridable rows are superseded placeholders -- skip them
                if (session.isOverridable) {
                    continue
                }
                // localize the slot note in place -> becomes the session title
                this.livestreamSessionResolver.transform(
                    session,
                    locale,
                    fallbackLocale,
                )
                // next concrete start for this weekly slot on or after now
                const nextStartAt = nextWeeklyOccurrence({
                    dayOfWeek: session.dayOfWeek,
                    time: session.startTime,
                    from: now,
                })
                // next concrete end on the same occurrence date (null when no end time)
                const nextEndAt = session.expectedEndTime
                    ? nextWeeklyOccurrence({
                        dayOfWeek: session.dayOfWeek,
                        time: session.expectedEndTime,
                        from: nextStartAt,
                    })
                    : null
                upcoming.push({
                    courseGlobalId: toGlobalId(CourseEntity.name,
                        course.id),
                    courseTitle: course.title,
                    courseDisplayId: course.displayId,
                    // the localized note doubles as the session title (null when none)
                    sessionTitle: session.note,
                    nextStartAt,
                    nextEndAt,
                })
            }
        }

        // soonest first, then keep only the earliest `take`
        return upcoming
            .sort((prev, next) => prev.nextStartAt.getTime() - next.nextStartAt.getTime())
            .slice(0,
                take)
    }
}
