import {
    Args,
    Int,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    GraphQLLocale,
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    ChangelogEntryEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
} from "@modules/databases"
import {
    ChangelogEntriesResponse,
    ChangelogEntryItemData,
} from "./graphql-types"

/** Hard cap on how many entries the rail can request. */
const MAX_LIMIT = 20

@Resolver()
/**
 * Public query returning recent published changelog entries (newest first) for
 * the dashboard right rail. `title`/`body` are resolved to the request locale.
 */
export class ChangelogEntriesResolver {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Changelog fetched successfully",
        [Locale.Vi]: "Lấy nhật ký cập nhật thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ChangelogEntriesResponse,
        {
            name: "changelogEntries",
            description: "Returns recent published changelog entries (newest first).",
        },
    )
    async execute(
        @GraphQLLocale()
            locale: Locale,
        @Args("limit",
            {
                type: () => Int,
                nullable: true,
                defaultValue: 4,
                description: "Max entries to return.",
            })
            limit: number,
    ): Promise<Array<ChangelogEntryItemData>> {
        // clamp the page size into [1, MAX_LIMIT]
        const take = Math.min(Math.max(limit ?? 4,
            1),
        MAX_LIMIT)
        // published entries, newest first
        const entries = await this.entityManager.find(
            ChangelogEntryEntity,
            {
                where: {
                    isPublished: true,
                },
                order: {
                    publishedAt: "DESC",
                },
                take,
            },
        )
        // resolve the inline bilingual text to the request locale
        const lang = locale === Locale.Vi ? "vi" : "en"
        return entries.map((entry) => ({
            id: entry.id,
            title: entry.title[lang],
            body: entry.body ? entry.body[lang] : null,
            category: entry.category,
            publishedAt: entry.publishedAt,
            linkUrl: entry.linkUrl,
        }))
    }
}
