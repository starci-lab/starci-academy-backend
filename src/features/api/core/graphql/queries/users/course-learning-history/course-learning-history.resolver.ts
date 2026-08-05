import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    EntityManager,
} from "typeorm"
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
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    CourseLearningHistoryFailedException,
} from "@modules/platform/exceptions/errors/courses/course-learning-history-failed"
import {
    fromGlobalId,
} from "@modules/platform/routing/utils/global-id"
import {
    CourseLearningHistoryRequest,
} from "./graphql-types/request"
import {
    CourseLearningHistoryResponse,
    CourseLearningHistoryResponseData,
} from "./graphql-types/response"
import {
    CourseLearningHistoryRow,
    DecodedCourseLearningHistoryCursor,
} from "./types"

/** Hard cap on page size to bound the query regardless of client input. */
const MAX_LIMIT = 50

@Resolver()
/**
 * The viewer's learning events within a single course -- the per-course
 * "learning history" tab the frontend groups by day. This is an explicit
 * EXCEPTION to the house CQRS-projection rule: it is a chronological FEED (like
 * `userFeed`), not a heavy aggregate, so it is built as a direct resolver.
 *
 * Activities are GLOBAL and never store a course id in their payload, so each
 * lessonRead / challengePassed / milestonePassed activity's target is joined
 * back to its course in a single UNION query -- never N+1 per row:
 *   - lessonRead       -> content -> module -> course
 *   - challengePassed  -> challenge -> content -> module -> course
 *   - milestonePassed  -> milestone_task -> milestone -> course
 * Ordering is absolute newest-first (created_at DESC, id DESC) -> plain offset
 * pagination, mirroring `userFeed`.
 */
export class CourseLearningHistoryResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly winstonService: WinstonService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Course learning history fetched successfully",
        [Locale.Vi]: "Lấy lịch sử học của khóa thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => CourseLearningHistoryResponse,
        {
            name: "courseLearningHistory",
            description:
                "The viewer's learning events (lesson/challenge/milestone) within one course, newest first.",
        },
    )
    async execute(
        @Args("request")
            request: CourseLearningHistoryRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<CourseLearningHistoryResponseData> {
        // decode the opaque relay course id; malformed -> typed exception (fail closed)
        const decoded = fromGlobalId(request.courseId)
        if (!decoded) {
            const exception = new CourseLearningHistoryFailedException({
                reason: "malformed course global id",
            })
            this.winstonService.log(
                WinstonLog.RequestHandlingFailed,
                {
                    op: "course-learning-history.malformed-course-id",
                    userId: user.id,
                    error: exception.message,
                },
            )
            throw exception
        }
        const courseId = decoded.id

        // clamp page size; fetch one extra row to know whether a next page exists
        const limit = Math.min(Math.max(request.limit ?? 20,
            1),
        MAX_LIMIT)
        // absent/malformed cursor -> page 1 (offset 0)
        const offset = this.decodeCursor(request.cursor)?.offset ?? 0

        let rows: Array<CourseLearningHistoryRow>
        try {
            // single UNION query: each event kind joins its target back to course_id,
            // filtered to this viewer + this course; ordered newest-first with offset.
            rows = await this.entityManager.query<Array<CourseLearningHistoryRow>>(
                `
                SELECT * FROM (
                    SELECT a.id           AS "id",
                           a.type         AS "type",
                           c.title        AS "label",
                           a.created_at   AS "at",
                           m.title        AS "moduleTitle",
                           c.difficulty   AS "difficulty"
                    FROM activities a
                    JOIN contents c ON c.id = (a.payload -> 'target' ->> 'id')::uuid
                    JOIN modules m  ON m.id = c.module_id
                    WHERE a.user_id = $1
                      AND a.type = 'lessonRead'
                      AND m.course_id = $2

                    UNION ALL

                    SELECT a.id           AS "id",
                           a.type         AS "type",
                           ch.title       AS "label",
                           a.created_at   AS "at",
                           m.title        AS "moduleTitle",
                           c.difficulty   AS "difficulty"
                    FROM activities a
                    JOIN challenges ch ON ch.id = (a.payload -> 'target' ->> 'id')::uuid
                    JOIN contents c    ON c.id = ch.content_id
                    JOIN modules m     ON m.id = c.module_id
                    WHERE a.user_id = $1
                      AND a.type = 'challengePassed'
                      AND m.course_id = $2

                    UNION ALL

                    SELECT a.id           AS "id",
                           a.type         AS "type",
                           mt.title       AS "label",
                           a.created_at   AS "at",
                           NULL           AS "moduleTitle",
                           NULL           AS "difficulty"
                    FROM activities a
                    JOIN milestone_tasks mt ON mt.id = (a.payload -> 'target' ->> 'id')::uuid
                    JOIN milestones ms      ON ms.id = mt.milestone_id
                    WHERE a.user_id = $1
                      AND a.type = 'milestonePassed'
                      AND ms.course_id = $2
                ) events
                ORDER BY events."at" DESC, events."id" DESC
                OFFSET ${offset}
                LIMIT ${limit + 1}
                `,
                [
                    user.id,
                    courseId,
                ],
            )
        } catch (error) {
            const exception = new CourseLearningHistoryFailedException({
                reason: "learning-history query failed",
                originalError: error as Error,
            })
            this.winstonService.log(
                WinstonLog.RequestHandlingFailed,
                {
                    op: "course-learning-history.query",
                    userId: user.id,
                    error: exception.message,
                    meta: {
                        courseId,
                    },
                },
            )
            throw exception
        }

        // the (limit+1)th row only tells us there is more -> trim it off
        const hasMore = rows.length > limit
        const pageRows = hasMore ? rows.slice(0,
            limit) : rows
        // advance the offset by the page we just consumed
        const nextCursor = hasMore
            ? this.encodeCursor(offset + limit)
            : null

        // shape each row to a learning-history item (timestamps stay as Date)
        const items = pageRows.map((row) => ({
            id: row.id,
            type: row.type,
            label: row.label,
            at: row.at,
            moduleTitle: row.moduleTitle,
            difficulty: row.difficulty,
        }))

        return {
            items,
            nextCursor,
        }
    }

    /**
     * Encode the next `offset` into an opaque base64url token the client passes
     * back verbatim to fetch the following page.
     *
     * @param offset - rows to skip on the next page
     * @returns the opaque cursor string
     */
    private encodeCursor(offset: number): string {
        return Buffer.from(JSON.stringify({
            offset,
        }),
        "utf8").toString("base64url")
    }

    /**
     * Decode an opaque cursor back to `{ offset }`. Returns null when absent or
     * malformed (treated as page 1 -> offset 0).
     *
     * @param cursor - the opaque cursor, or undefined
     * @returns the decoded cursor, or null
     */
    private decodeCursor(cursor?: string): DecodedCourseLearningHistoryCursor | null {
        if (!cursor) {
            return null
        }
        // base64url -> JSON; bail to page 1 on any bad/partial token
        try {
            const raw = Buffer.from(cursor,
                "base64url").toString("utf8")
            const parsed = JSON.parse(raw) as Partial<DecodedCourseLearningHistoryCursor>
            if (typeof parsed.offset !== "number"
                || !Number.isFinite(parsed.offset)
                || parsed.offset < 0) {
                return null
            }
            return {
                offset: Math.floor(parsed.offset),
            }
        } catch {
            return null
        }
    }
}
