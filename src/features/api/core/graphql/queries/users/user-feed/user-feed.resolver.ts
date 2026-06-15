import {
    Args,
    Context,
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
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakOptionalAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    LabelResolverService,
    toGlobalId,
} from "@modules/routing"
import {
    MyFeedResponseData,
} from "../../dashboard/my-feed/graphql-types"
import {
    isProfileHiddenFromViewer,
} from "../utils"
import {
    UserFeedRequest,
    UserFeedResponse,
} from "./graphql-types"
import {
    DecodedUserFeedCursor,
    UserFeedRow,
} from "./types"

/** Hard cap on page size to bound the query regardless of client input. */
const MAX_LIMIT = 50

/**
 * A single user's activity timeline — the profile "activity" tab. Unlike the
 * score-ranked home feed, ordering here is absolute newest-first
 * (created_at DESC, id DESC), so pagination is plain offset (no pinned decay
 * reference needed). Filtered to one `user_id`; target labels are batch-resolved
 * from id-only refs. Optional auth — anonymous viewers may read any user's
 * public timeline.
 */
@Resolver()
export class UserFeedResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly labelResolverService: LabelResolverService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakOptionalAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Activity fetched successfully",
        [Locale.Vi]: "Lấy hoạt động thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserFeedResponse,
        {
            name: "userFeed",
            description: "Cursor-paginated activity timeline of a single user (newest first).",
        },
    )
    async execute(
        @Args("request")
            request: UserFeedRequest,
        @GraphQLLocale()
            locale: Locale,
        @Context()
            context: { req?: { user?: { id?: string } } },
    ): Promise<MyFeedResponseData> {
        // locked profile → withhold the timeline from everyone but the owner
        if (await isProfileHiddenFromViewer({
            entityManager: this.entityManager,
            userId: request.userId,
            viewerId: context.req?.user?.id,
        })) {
            return {
                items: [],
                nextCursor: null,
            }
        }
        // clamp page size; fetch one extra row to know whether a next page exists
        const limit = Math.min(Math.max(request.limit ?? 20,
            1),
        MAX_LIMIT)
        // absent/malformed cursor → page 1 (offset 0)
        const offset = this.decodeCursor(request.cursor)?.offset ?? 0

        // newest-first timeline for exactly this user; limit+1 probes for "more"
        const rows = await this.entityManager.query<Array<UserFeedRow>>(
            `
            SELECT a.id            AS "id",
                   a.user_id       AS "actorUserId",
                   u.username      AS "actorUsername",
                   u.avatar        AS "actorAvatar",
                   a.type          AS "type",
                   a.payload       AS "metadata",
                   a.created_at    AS "at"
            FROM activities a
            JOIN users u ON u.id = a.user_id
            WHERE a.user_id = $1
            ORDER BY a.created_at DESC, a.id DESC
            OFFSET ${offset}
            LIMIT ${limit + 1}
            `,
            [
                request.userId,
            ],
        )

        // the (limit+1)th row only tells us there is more → trim it off
        const hasMore = rows.length > limit
        const pageRows = hasMore ? rows.slice(0,
            limit) : rows
        // advance the offset by the page we just consumed
        const nextCursor = hasMore
            ? this.encodeCursor(offset + limit)
            : null

        // batch-resolve target labels (one query/kind + cache), id-only refs
        const targetRefs = pageRows
            .map((row) => row.metadata?.target)
            .filter((target): target is NonNullable<typeof target> => Boolean(target))
            .map((target) => ({
                entityName: target.entityName,
                id: target.id,
            }))
        const labelMap = await this.labelResolverService.resolveLabels({
            refs: targetRefs,
            locale,
        })

        // map each row to a token-based feed item (actor = the profile owner)
        const items = pageRows.map((row) => {
            const target = row.metadata?.target
            const targetGlobalId = target ? toGlobalId(target.entityName,
                target.id) : null
            return {
                actorGlobalId: toGlobalId(UserEntity.name,
                    row.actorUserId),
                actorUsername: row.actorUsername,
                actorAvatar: row.actorAvatar,
                type: row.type,
                targetGlobalId,
                targetLabel: (targetGlobalId ? labelMap.get(targetGlobalId) : null)
                    ?? target?.label
                    ?? null,
                at: row.at,
            }
        })

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
     * malformed (treated as page 1 → offset 0).
     *
     * @param cursor - the opaque cursor, or undefined
     * @returns the decoded cursor, or null
     */
    private decodeCursor(cursor?: string): DecodedUserFeedCursor | null {
        if (!cursor) {
            return null
        }
        // base64url → JSON; bail to page 1 on any bad/partial token
        try {
            const raw = Buffer.from(cursor,
                "base64url").toString("utf8")
            const parsed = JSON.parse(raw) as Partial<DecodedUserFeedCursor>
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
