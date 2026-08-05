import {
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
} from "typeorm"
import {
    AbstractProjectionEntity,
} from "./abstract-projection"
import {
    ContentEntity,
} from "./content.entity"
import {
    ContentEngagementProjectionTranslationEntity,
} from "./content-engagement-projection-translation.entity"

@Entity("content_engagement_projections")
/**
 * CQRS projection of a content's engagement (Kiểu A — single natural key).
 *
 * Primary key is `content_id` (one row per content); the aggregate
 * (`{ totalReactions, reactionsByType, viewCount, shareCount, commentCount }`)
 * lives in the inherited jsonb `value`. Recomputed on react/comment/read +
 * CDC, read with a TTL lazy-refresh — the table stands in for the old Redis
 * view-count cache.
 */
export class ContentEngagementProjectionEntity extends AbstractProjectionEntity {
    /** Target content id — the natural primary key (one row per content). */
    @PrimaryColumn({
        name: "content_id",
        type: "uuid",
    })
        contentId: string

    /** The content this engagement row belongs to (cascade-deleted with it). */
    @ManyToOne(
        () => ContentEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "content_id",
        referencedColumnName: "id",
        foreignKeyConstraintName: "fk_content_id_content_engagement_projections_contents",
    })
        content: ContentEntity

    /** Localized overrides (empty until the projection snapshots display text). */
    @OneToMany(
        () => ContentEngagementProjectionTranslationEntity,
        (translation: ContentEngagementProjectionTranslationEntity) =>
            translation.contentEngagementProjection,
        {
            cascade: true,
        },
    )
        translations: Array<ContentEngagementProjectionTranslationEntity>
}
