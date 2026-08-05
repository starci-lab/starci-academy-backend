import {
    Field,
    ObjectType,
} from "@nestjs/graphql"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm"
import {
    AbstractEntity,
} from "./abstract"
import {
    UserStatsProjectionEntity,
} from "./user-stats-projection.entity"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums"

@ObjectType({
    description: "Localized value for a user-stats projection field.",
})
@Entity("user_stats_projection_translations")
/**
 * Localized overrides for {@link UserStatsProjectionEntity} fields.
 *
 * Each row: (userId, locale, field) -> translated value. Starts EMPTY (the
 * projection is numeric-only today). Composite primary key (userId, locale, field).
 */
export class UserStatsProjectionTranslationEntity extends AbstractEntity {
    /** Target projection natural key (user id) — part of the composite PK. */
    @Field(
        () => String,
        {
            description: "Target user id.",
        },
    )
    @PrimaryColumn({
        name: "user_id",
        type: "uuid",
    })
        userId: string

    /** Locale of the translation (e.g. vi, en). */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Locale of the translation (e.g. vi, en).",
        },
    )
    @PrimaryColumn({
        name: "locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        locale: Locale

    /** Target field name being translated. */
    @Field(
        () => String,
        {
            description: "Target field name being translated.",
        },
    )
    @PrimaryColumn({
        name: "field",
        type: "varchar",
        length: 128,
    })
        field: string

    /** Translated value for the field. */
    @Field(
        () => String,
        {
            description: "Translated value for the field.",
        },
    )
    @Column({
        name: "value",
        type: "text",
    })
        value: string

    /** Parent projection row (cascade-deleted with it). */
    @ManyToOne(
        () => UserStatsProjectionEntity,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "user_id",
        referencedColumnName: "userId",
        foreignKeyConstraintName: "fk_user_id_user_stats_projection_translations",
    })
        userStatsProjection: UserStatsProjectionEntity
}
