import {
    Field,
    ID,
    Int,
    ObjectType,
} from "@nestjs/graphql"
import {
    GraphQLTypeLocale,
    Locale,
} from "../enums/locale"
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    RelationId,
} from "typeorm"
import {
    UuidAbstractEntity,
} from "./abstract"
import {
    FoundationEntity,
} from "./foundation.entity"
import {
    FoundationTagTranslationEntity,
} from "./foundation-tag-translation.entity"

@ObjectType({
    description: "Tag value attached to a foundation item.",
})
@Entity("foundation_tags")
/**
 * Tag attached to a foundation item (e.g. Docker, Video).
 */
export class FoundationTagEntity extends UuidAbstractEntity {
    /**
     * Display value (default locale); override per locale via `translations` field `value`.
     */
    @Field(
        () => String,
        {
            description: "Tag value; localized via translations (`field`: value).",
        },
    )
    @Column({
        name: "value",
        type: "varchar",
        length: 255,
    })
        value: string

    /**
     * Display order within the parent foundation tag list.
     */
    @Field(
        () => Int,
        {
            description: "Display order within the parent foundation tag list.",
        },
    )
    @Column({
        name: "order_index",
        type: "int",
        default: 0,
    })
        orderIndex: number

    /**
     * Pure ordering index used to reorder the list (decoupled from orderIndex).
     */
    @Field(() => Int,
        {
            description: "Pure ordering index used to reorder the list (decoupled from orderIndex)." 
        })
    @Column({
        name: "sort_index", type: "int", default: 0 
    })
        sortIndex: number

    /**
     * Default locale for this tag row.
     */
    @Field(
        () => GraphQLTypeLocale,
        {
            description: "Default locale for this tag row.",
        },
    )
    @Column({
        name: "default_locale",
        type: "enum",
        enum: Locale,
        enumName: "locale",
    })
        defaultLocale: Locale

    /**
     * Parent foundation this tag belongs to.
     */
    @Field(
        () => FoundationEntity,
        {
            description: "Parent foundation this tag belongs to.",
        },
    )
    @ManyToOne(
        () => FoundationEntity,
        (foundation: FoundationEntity) => foundation.tags,
        {
            onDelete: "CASCADE",
        },
    )
    @JoinColumn({
        name: "foundation_id",
        foreignKeyConstraintName:
            "fk_foundation_id_foundation_tags_foundations",
    })
        foundation: FoundationEntity

    @Field(
        () => ID,
        {
            description: "Parent foundation ID.",
        },
    )
    @RelationId(
        (tag: FoundationTagEntity) => tag.foundation,
    )
        foundationId: string

    @Field(
        () => [FoundationTagTranslationEntity],
        {
            description: "Localized overrides for the tag value (`field`: value).",
        },
    )
    @OneToMany(
        () => FoundationTagTranslationEntity,
        (translation: FoundationTagTranslationEntity) => translation.foundationTag,
        {
            cascade: true,
            orphanedRowAction: "delete",
        },
    )
        translations: Array<FoundationTagTranslationEntity>
}
