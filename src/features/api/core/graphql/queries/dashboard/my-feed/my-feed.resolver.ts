import {
    Args,
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
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
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
    MyFeedRequest,
    MyFeedResponse,
    MyFeedResponseData,
    MyFeedTab,
} from "./graphql-types"
import {
    DecodedFeedCursor,
    MyFeedRow,
} from "./types"

/** Hard cap on page size to bound the query regardless of client input. */
const MAX_LIMIT = 50

/**
 * Cursor-paginated home feed (the activity stream is append-only → keyset cursor
 * on `(created_at, id)`, not page offsets). "following" = followed users'
 * activity; "forYou" = recent platform-wide activity (excluding the viewer).
 * Target labels are batch-resolved from ids (id-only refs).
 */
@Resolver()
export class MyFeedResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly labelResolverService: LabelResolverService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @UseGuards(KeycloakAuthGraphQLGuard)
    @GraphQLSuccessMessage({
        [Locale.En]: "Feed fetched successfully",
        [Locale.Vi]: "Lấy bảng tin thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => MyFeedResponse,
        {
            name: "myFeed",
            description: "Cursor-paginated home feed (forYou | following).",
        },
    )
    async execute(
        @Args("request")
            request: MyFeedRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<MyFeedResponseData> {
        // clamp page size; fetch one extra row to know whether a next page exists
        const limit = Math.min(Math.max(request.limit ?? 20,
            1),
        MAX_LIMIT)
        const decoded = this.decodeCursor(request.cursor)

        // params: $1 user, [$2 cursorAt, $3 cursorId] when paginating
        const params: Array<unknown> = [
            user.id,
        ]
        // keyset predicate for "older than the previous page's last item"
        let cursorClause = ""
        if (decoded) {
            params.push(decoded.at,
                decoded.id)
            cursorClause = "AND (a.created_at, a.id) < ($2::timestamptz, $3::uuid)"
        }
        // tab decides the source set: following-graph vs whole platform
        const tabClause = request.tab === MyFeedTab.Following
            ? "JOIN user_follows f ON f.following_id = a.user_id WHERE f.follower_id = $1"
            : "WHERE a.user_id <> $1"

        const rows = await this.entityManager.query<Array<MyFeedRow>>(
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
            ${tabClause}
            ${cursorClause}
            ORDER BY a.created_at DESC, a.id DESC
            LIMIT ${limit + 1}
            `,
            params,
        )

        // the (limit+1)th row only tells us there is more → trim it off
        const hasMore = rows.length > limit
        const pageRows = hasMore ? rows.slice(0,
            limit) : rows
        const last = pageRows[pageRows.length - 1]
        const nextCursor = hasMore && last ? this.encodeCursor(last.at,
            last.id) : null

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
     * Encode a keyset cursor from the last row's `(created_at, id)` into an opaque
     * base64url token the client passes back verbatim.
     *
     * @param at - the row's created_at
     * @param id - the row's id (tiebreak)
     * @returns the opaque cursor string
     */
    private encodeCursor(
        at: Date,
        id: string,
    ): string {
        return Buffer.from(`${at.toISOString()}|${id}`,
            "utf8").toString("base64url")
    }

    /**
     * Decode an opaque cursor back to `(at, id)`. Returns null when absent or
     * malformed (treated as page 1).
     *
     * @param cursor - the opaque cursor, or undefined
     * @returns the decoded cursor, or null
     */
    private decodeCursor(cursor?: string): DecodedFeedCursor | null {
        if (!cursor) {
            return null
        }
        // base64url → "<isoTimestamp>|<id>"; bail to page 1 on any bad token
        let raw: string
        try {
            raw = Buffer.from(cursor,
                "base64url").toString("utf8")
        } catch {
            return null
        }
        const separatorIndex = raw.indexOf("|")
        if (separatorIndex <= 0) {
            return null
        }
        return {
            at: raw.slice(0,
                separatorIndex),
            id: raw.slice(separatorIndex + 1),
        }
    }
}
