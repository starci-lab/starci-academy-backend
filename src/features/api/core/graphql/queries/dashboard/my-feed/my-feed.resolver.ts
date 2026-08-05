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
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    LabelResolverService,
} from "@modules/platform/routing/label-resolver.service"
import {
    toGlobalId,
} from "@modules/platform/routing/utils/global-id"
import {
    MyFeedCategory,
    MyFeedRequest,
    MyFeedTab,
} from "./graphql-types/request"
import {
    MyFeedResponse,
    MyFeedResponseData,
} from "./graphql-types/response"
import {
    ACTIVITY_TYPE_WEIGHT,
    CATEGORY_TYPE_MAP,
    DEFAULT_ACTIVITY_WEIGHT,
    FEED_SCORE_HALF_LIFE_HOURS,
} from "./constants"
import {
    DecodedFeedCursor,
    MyFeedRow,
} from "./types"

/** Hard cap on page size to bound the query regardless of client input. */
const MAX_LIMIT = 50

@Resolver()
/**
 * Score-ranked home feed. Each activity gets `weight(type) x recencyDecay`, so
 * accomplishments (passing a milestone / challenge) surface above low-signal
 * social noise (follows, bookmarks) while recency still dominates -- a fresh follow
 * out-ranks a week-old completion. "following" = followed users' activity;
 * "forYou" = platform-wide (excluding the viewer). Because the score is relative
 * to "now", the page-1 `asOf` is pinned in the cursor and the ranking is walked
 * with offset pagination so it stays stable across "load more". Target labels are
 * batch-resolved from ids (id-only refs).
 */
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
        [Locale.Vi]: "Lấy bảng tin thành công", // vn-ok: vi-locale string emitted to clients
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

        // pin the decay reference on page 1 so the ranking stays stable while the
        // user pages; later pages reuse the page-1 `asOf` carried in the cursor
        const asOf = decoded?.asOf ?? new Date().toISOString()
        const offset = decoded?.offset ?? 0

        // params: $1 user, $2 decay reference (asOf); filter types appended below
        const params: Array<unknown> = [
            user.id,
            asOf,
        ]
        // tab decides the source set: following-graph vs whole platform
        const tabClause = request.tab === MyFeedTab.Following
            ? "JOIN user_follows f ON f.following_id = a.user_id WHERE f.follower_id = $1"
            : "WHERE a.user_id <> $1"

        // filter chip -> restrict to a set of activity types (null = All = no filter)
        const filterTypes = CATEGORY_TYPE_MAP[request.category ?? MyFeedCategory.All]
        let typeClause = ""
        if (filterTypes) {
            params.push(filterTypes)
            typeClause = `AND a.type = ANY($${params.length}::activity_type[])`
        }

        const rows = await this.entityManager.query<Array<MyFeedRow>>(
            `
            SELECT a.id            AS "id",
                   a.user_id       AS "actorUserId",
                   u.username      AS "actorUsername",
                   u.avatar        AS "actorAvatar",
                   a.type          AS "type",
                   a.payload       AS "metadata",
                   a.created_at    AS "at",
                   (SELECT COUNT(*) FROM activity_reactions ar WHERE ar.activity_id = a.id) AS "reactionCount",
                   (SELECT ar.type FROM activity_reactions ar WHERE ar.activity_id = a.id AND ar.user_id = $1) AS "myReaction"
            FROM activities a
            JOIN users u ON u.id = a.user_id
            ${tabClause}
            ${typeClause}
            ORDER BY ${this.scoreExpression()} DESC, a.created_at DESC, a.id DESC
            OFFSET ${offset}
            LIMIT ${limit + 1}
            `,
            params,
        )

        // the (limit+1)th row only tells us there is more -> trim it off
        const hasMore = rows.length > limit
        const pageRows = hasMore ? rows.slice(0,
            limit) : rows
        // advance the offset by the page we just consumed; keep the same `asOf`
        const nextCursor = hasMore
            ? this.encodeCursor(asOf,
                offset + limit)
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

        const items = pageRows.map((row) => {
            const target = row.metadata?.target
            const targetGlobalId = target ? toGlobalId(target.entityName,
                target.id) : null
            return {
                id: row.id,
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
                reactionCount: Number(row.reactionCount),
                myReaction: row.myReaction ?? null,
                // forYou excludes the viewer + you never follow yourself, so this is
                // always false here -- kept for a uniform item shape across feeds
                isMine: row.actorUserId === user.id,
            }
        })

        return {
            items,
            nextCursor,
        }
    }

    /**
     * Build the SQL relevance-score expression: per-type weight multiplied by an
     * exponential recency decay against the pinned `asOf` ($2). The weights are
     * trusted compile-time constants (not user input), so they are templated
     * directly. `a.type` is cast to text so the `CASE` matches enum labels.
     *
     * @returns the score SQL fragment
     */
    private scoreExpression(): string {
        // CASE a.type::text WHEN '<label>' THEN <weight> ... ELSE <default> END
        const whens = Object.entries(ACTIVITY_TYPE_WEIGHT)
            .map((entry) => `WHEN '${entry[0]}' THEN ${entry[1]}`)
            .join(" ")
        const weightCase = `CASE a.type::text ${whens} ELSE ${DEFAULT_ACTIVITY_WEIGHT} END`
        // 0.5 ^ (ageHours / halfLife) -> halves the weight every half-life
        const ageHours = "EXTRACT(EPOCH FROM ($2::timestamptz - a.created_at)) / 3600.0"
        return `(${weightCase}) * power(0.5, GREATEST(${ageHours}, 0) / ${FEED_SCORE_HALF_LIFE_HOURS}.0)`
    }

    /**
     * Encode the pinned `asOf` + next `offset` into an opaque base64url token the
     * client passes back verbatim to fetch the following page.
     *
     * @param asOf - the page-1 decay reference timestamp (ISO)
     * @param offset - rows to skip on the next page
     * @returns the opaque cursor string
     */
    private encodeCursor(
        asOf: string,
        offset: number,
    ): string {
        return Buffer.from(JSON.stringify({
            asOf,
            offset,
        }),
        "utf8").toString("base64url")
    }

    /**
     * Decode an opaque cursor back to `{ asOf, offset }`. Returns null when absent
     * or malformed (treated as page 1 -> fresh `asOf`, offset 0).
     *
     * @param cursor - the opaque cursor, or undefined
     * @returns the decoded cursor, or null
     */
    private decodeCursor(cursor?: string): DecodedFeedCursor | null {
        if (!cursor) {
            return null
        }
        // base64url -> JSON; bail to page 1 on any bad/partial token
        try {
            const raw = Buffer.from(cursor,
                "base64url").toString("utf8")
            const parsed = JSON.parse(raw) as Partial<DecodedFeedCursor>
            if (typeof parsed.asOf !== "string"
                || typeof parsed.offset !== "number"
                || !Number.isFinite(parsed.offset)
                || parsed.offset < 0) {
                return null
            }
            return {
                asOf: parsed.asOf,
                offset: Math.floor(parsed.offset),
            }
        } catch {
            return null
        }
    }
}
