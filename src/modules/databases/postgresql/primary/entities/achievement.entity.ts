import {
    Field,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    Unique,
} from "typeorm"
import {
    AchievementCriteriaType,
    GraphQLTypeAchievementCriteriaType,
} from "../enums"
import {
    UuidAbstractEntity,
} from "./abstract"
import type {
    LocalizedText,
} from "./advertisement.entity"

@ObjectType({
    description: "Definition of an earnable achievement / badge.",
})
// stable natural key — idempotent upsert from the boot seeder
@Unique("UQ_achievement_slug",
    ["slug"])
@Entity("achievements")
/**
 * Definition row for a GitHub-style achievement / badge. These are a small,
 * curated reference set (seeded on boot, upserted by `slug`); they describe WHAT
 * can be earned, not who earned it — the earned ledger lives in
 * {@link UserAchievementEntity}.
 *
 * `threshold` is the single-tier bar; `tierThresholds` (when set) describes a
 * tiered badge (like GitHub Pull Shark x2/x3/x4) whose ascending values each
 * grant a higher tier. The badge art is served by the client from MinIO at
 * `badges/achievements/<slug>.png`; only the `slug` is stored here (`iconKey`
 * keeps the resolved object key for clients that prefer it verbatim).
 */
export class AchievementEntity extends UuidAbstractEntity {
    /**
     * Stable slug — the badge identity, also the MinIO art filename stem.
     */
    @Field(
        () => String,
        {
            description: "Stable slug (also the badge art filename stem).",
        },
    )
    @Column({
        name: "slug",
        type: "varchar",
        length: 128,
    })
        slug: string

    /**
     * Bilingual display name (`{ en, vi }`), resolved by request locale.
     */
    @Field(
        () => String,
        {
            description: "Bilingual display name (en/vi).",
        },
    )
    @Column({
        name: "name",
        type: "jsonb",
    })
        name: LocalizedText

    /**
     * Bilingual one-line description of how the achievement is earned.
     */
    @Field(
        () => String,
        {
            description: "Bilingual description (en/vi).",
        },
    )
    @Column({
        name: "description",
        type: "jsonb",
    })
        description: LocalizedText

    /**
     * Which source metric this achievement is measured against.
     */
    @Field(
        () => GraphQLTypeAchievementCriteriaType,
        {
            description: "The source metric this achievement is measured against.",
        },
    )
    @Column({
        name: "criteria_type",
        type: "enum",
        enum: AchievementCriteriaType,
        enumName: "achievement_criteria_type",
    })
        criteriaType: AchievementCriteriaType

    /**
     * Single-tier bar: the metric value at which the achievement is earned. For
     * a tiered badge this is the FIRST tier (kept in sync with `tierThresholds[0]`)
     * so a non-tier-aware reader still has a meaningful "earned" boundary.
     */
    @Field(
        () => Int,
        {
            description: "Metric value at which the achievement is earned (first tier when tiered).",
        },
    )
    @Column({
        name: "threshold",
        type: "int",
    })
        threshold: number

    /**
     * Ascending tier bars for a tiered badge (e.g. `[10, 25, 50]`); null for a
     * single-tier achievement. Each value reached grants the next higher tier.
     */
    @Field(
        () => [Int],
        {
            nullable: true,
            description: "Ascending tier bars for a tiered badge; null when single-tier.",
        },
    )
    @Column({
        name: "tier_thresholds",
        type: "jsonb",
        nullable: true,
    })
        tierThresholds: Array<number> | null

    /**
     * MinIO object key of the badge art (`badges/achievements/<slug>.png`). The
     * client fetches the image from here and handles its own fallback.
     */
    @Field(
        () => String,
        {
            description: "MinIO object key of the badge art.",
        },
    )
    @Column({
        name: "icon_key",
        type: "varchar",
        length: 256,
    })
        iconKey: string

    /**
     * Display order on the profile (ascending). Lets the curated set keep a
     * deliberate sequence independent of insertion order.
     */
    @Field(
        () => Int,
        {
            description: "Display order on the profile (ascending).",
        },
    )
    @Column({
        name: "sort_index",
        type: "int",
        default: 0,
    })
        sortIndex: number
}
